const router = require('koa-router')()		
//注册  登录 接口 

// 引入统一给前端返回的body响应
const result = require('../../config/result')
// 操作数据库接口
const {getToken,Addurl,Tripurl,Updateurl} = require('../../config/databaseapi')
// 校验
const {checking,regcheck, shopinfor,catecheck} = require('../../config/checking')

// 解析token合法性
const {Auth} = require('../../token/auth')

// 图片上传
const {upload,cosfun} = require('../../cos/cos')

// 图片上传接口name:"file"
router.post('/uploadres',upload.single('file'), async ctx=>{
	// console.log(123);
	// console.log("20",ctx.file.path);	//接收前端上传静态资源文件  ctx.file
	try{
		const res= await cosfun(ctx.file.filename,ctx.file.path)
		
		new result(ctx,'SUCCESS',200,'https://'+res.Location).answer()
	}catch(e){
		new result(ctx,'上传失败，服务器发生错误',500).answer()
	}
})

// 商家信息上传
router.post('/uploadshop',new Auth().m, async ctx=>{
	const {id,name,address,logo} = ctx.request.body;
	// console.log(id);
	new shopinfor(ctx,name,address,logo).start()
	// 提交到数据库
	// 数组不用''
	let query = `db.collection('shop-infor').add({data:{name:'${name}',address:'${address}',logo:${logo}}})`
	// console.log("38",query);
	try{
		await new getToken().postever(Addurl,query)
		new result(ctx,'提交成功').answer()
	}catch(e){
		//TODO handle the exception
		new result(ctx,'提交失败，服务器发生错误',500).answer()
	}
})

// 获取商家信息接口
router.get('/obtainshop',new Auth().m,async ctx=>{
	const query = `db.collection('shop-infor').get()`
	try{
		let res = await new getToken().postever(Tripurl,query)
		const data = res.data.map(item=>{
			return JSON.parse(item)
		})
		new result(ctx,'SUCCESS',200,data).answer()
		// console.log(res);
	}catch(e){
		//TODO handle the exception
		new result(ctx,'提交失败，服务器发生错误',500).answer()
	}
})

// 更新修改商家信息
router.post('/modifyshop',new Auth().m,async ctx=>{
	const {id,name,address,logo} = ctx.request.body;
	// console.log("67",id);
	new shopinfor(ctx,name,address,logo).start()
	// 提交数据库
	const query = `db.collection('shop-infor').doc('${id}').update({data:{name:'${name}',address:'${address}',logo:${logo}}})`
	try{
		await new getToken().postever(Updateurl,query)
		new result(ctx,'提交成功').answer()
	}catch(e){
		//TODO handle the exception
		new result(ctx,'修改失败',500).answer()
		
	}
	
})	

// 添加菜品类型
router.post('/addcategory',new Auth().m,async ctx=>{
	const {category} = ctx.request.body;
	// 校验
	new catecheck(ctx,category).start()
	// 使用时间戳生成分类id
	const cid = 'a' + new Date().getTime()
	// 查询数据库是否已存在该类名
	const query =`db.collection('dishes-category').where({label:'${category}'}).get()`
	const cate = `db.collection('dishes-category').add({data:{value:'${category}',label:'${category}',cid:'${cid}',count:0,sele_quantity:0}})`

	try{
		const res = await new getToken().postever(Tripurl,query)
		// console.log("95",res);
		if(res.data.length>0){
			// 该类目已经存在
			new result(ctx,'该类目已经存在',202).answer()
		}else{
			// 类目不存在
			await new getToken().postever(Addurl,cate)
			new result(ctx,'添加成功').answer()
		}
	}catch(e){
		//TODO handle the exception
		new result(ctx,'添加失败',500).answer()
	}
	
})

// 获取菜品类目
router.get('/obtaincate',new Auth().m,async ctx=>{
	// get路径携带前端传来的分页数字
	// 关于分页 小程序端默认返回20条，nodejs端默认返回10条，云函数默认返回100条
	let {page} = ctx.query;
	let sk = page * 10
	const query = `db.collection('dishes-category').orderBy('cid','desc').limit(10).skip(${sk}).get()`
	// console.log("118",query);
	try{
		const res = await new getToken().postever(Tripurl,query)
		let total = {total:res.pager.Total}
		const data = res.data.map(item=>{return JSON.parse(item)})
		const array = {...{result:data},...total}
		// console.log("124",array);
		new result(ctx,'SUCCESS',200,array).answer()
	}catch(e){
		new result(ctx,'服务器发生错误',200,array).answer()
		//TODO handle the exception
	}
})

module.exports = router.routes()