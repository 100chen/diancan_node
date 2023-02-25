const router = require('koa-router')()		
//注册  登录 接口 

// 引入统一给前端返回的body响应
const result = require('../../config/result')
// 操作数据库接口
const {getToken,Addurl,Tripurl,Updateurl} = require('../../config/databaseapi')
// 校验
const {checking,regcheck, shopinfor,catecheck,unitcheck, putoncheck} = require('../../config/checking')

// 解析token合法性
const {Auth} = require('../../token/auth')
// 图片上传
const {upload,cosfun} = require('../../cos/cos')
// 时间模块
const moment = require('moment');
moment.locale('zh-cn')


// 获取菜品单位
router.get('/obtainunit',new Auth().m, async ctx=>{
	const query = `db.collection('dishunit').get()`
	try{
		const res= await new getToken().postever(Tripurl,query)
		const data = res.data.map(item=>{return JSON.parse(item)})
		// console.log("22",res);
		// console.log("24",data);
		new result(ctx,'SUCCESS',200,data).answer()
	}catch(e){
		//TODO handle the exception
		new result(ctx,'服务器出现错误',500).answer()
	}
})

// 添加菜品单位
router.post('/dishunit',new Auth().m, async ctx=>{
	const {unit} = ctx.request.body;
	// 校验
	new unitcheck(ctx,unit).start()
	// 提交到数据库是否已有
	const unid = new Date().getTime()
	const query = `db.collection('dishunit').where({label:'${unit}'}).get()`
	const cate = `db.collection('dishunit').add({data:{value:'${unit}',label:'${unit}',unid:'${unid}'}})`
	try{
		const res= await new getToken().postever(Tripurl,query)
		if(res.data.length > 0){
			new result(ctx,'该单位已存在',202).answer()
		}else{
			const res= await new getToken().postever(Addurl,cate)
			new result(ctx,'添加成功').answer()
		}
	}catch(e){
		// console.log("52",e);
		//TODO handle the exception
		new result(ctx,'添加失败，服务器发生错误',500).answer()
	}
	
})

// 上架菜品
router.post('/uploaddishes',new Auth().m, async ctx=>{
	const {id,category,name,unitprice,unit,image,value} = ctx.request.body;
	// 校验
	new putoncheck(ctx,category,name,unitprice,unit,image,value).start()
	// console.log('通过')
	// 当前时间  utcOffset(8) 设置东八区 北京时间  避免上传服务器出现时间差问题
	let time = moment().utcOffset(8).format('YYYY-MM-DD HH:mm:ss')
	let query = `db.collection('dishes-data').add({data:{
		category:'${category}',name:'${name}',unitprice:'${unitprice}',unit:'${unit}',
		image:${image},quantity:0,onsale:true,cid:'${value}',time:'${time}',monthlysale:0
	}})`
	// console.log(query);
	// 对当前类目下的count字段自增
	let count = `db.collection('dishes-category').where({cid:'${value}'}).update({data:{count:db.command.inc(1)}})`
	try{
		await new getToken().postever(Addurl,query)
		await new getToken().postever(Updateurl,count)
		new result(ctx,'提交成功',200).answer()
	}catch(e){
		//TODO handle the exception
		new result(ctx,'提交失败，服务器发生错误',500).answer()
	}
	
})

// 获取菜品数据
router.get('/obtaindishes',new Auth().m,async ctx=>{
	let {page} = ctx.query;
	let sk = page*10;
	const query = `db.collection('dishes-data').orderBy('time','desc').limit(10).skip(${sk}).get()`
	try{
		const res = await new getToken().postever(Tripurl,query)
		console.log("93",res);
		const data = res.data.map(item=>{return JSON.parse(item)})
		// console.log(res);
		const total = {total:res.pager.Total}
		const array = {...{result:data},...total}
		console.log(array);
		new result(ctx,'SUCCESS',200,array).answer()
	}catch(e){
		//TODO handle the exception
		new result(ctx,'服务器出错',500).answer()
	}
})

// 下架商品
router.get('/fromsale',new Auth().m,async ctx=>{
	const {id,value} = ctx.query;
	// 修改菜品onsale为false
	const query = `db.collection('dishes-data').doc('${id}').update({data:{onsale:false}})`
	// console.log("111",query);
	// 查询在那个类目下将count字段自减
	let count = `db.collection('dishes-category').where({cid:'${value}'}).update({data:{count:db.command.inc(-1)}})`
	// console.log("114",count);
	try{
		await new getToken().postever(Updateurl,query)
		await new getToken().postever(Updateurl,count)
		new result(ctx,'已经下架',200).answer()
	}catch(e){
		//TODO handle the exception
		
		new result(ctx,'服务器发生错误',500).answer()
	}
})

// 编辑菜品
router.post('/modifydishes',new Auth().m,async ctx=>{
	const {id,category,name,unitprice,unit,image,value} = ctx.request.body;
	// 校验
	new putoncheck(ctx,category,name,unitprice,unit,image,value).start()
	// 当前时间  utcOffset(8) 设置东八区 北京时间  避免上传服务器出现时间差问题
	let time = moment().utcOffset(8).format('YYYY-MM-DD HH:mm:ss')
	let query = `db.collection('dishes-data').doc('${id}').update({data:{
		category:'${category}',name:'${name}',unitprice:'${unitprice}',unit:'${unit}',
		image:${image},quantity:0,onsale:true,cid:'${value}',time:'${time}'
	}})`
	try{
		await new getToken().postever(Updateurl,query)
		new result(ctx,'修改成功').answer()
	}catch(e){
		//TODO handle the exception
		new result(ctx,'修改失败，服务器发生错误',500).answer()
	}
})

module.exports = router.routes()