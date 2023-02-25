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

// 价格补零  
const Price = require('e-commerce_price')

// 获取订单
router.get('/obtainorder',new Auth().m, async ctx=>{
	let {page,transac_status} = ctx.query;
	let sk = Number(page) *10;
	let param = {}
	if(transac_status != ''){
		param['transac_status'] = transac_status
	}else {
		delete param.transac_status
	}
	let OBJ = JSON.stringify(param)
	const query = `db.collection('order_data').where(${OBJ}).field({menu:false}).orderBy('order_time','desc').limit(10).skip(${sk}).get()`
	try{
		const res = await new getToken().postever(Tripurl,query)
		let total = {total:res.pager.Total}
		const data = res.data.map(item=>{return JSON.parse(item)})
		const array = {...{result:data},...total}
		// console.log("124",array);
		new result(ctx,'SUCCESS',200,array).answer()
	}catch(e){
		console.log(e);
		new result(ctx,'服务器端错误',500).answer()
		//TODO handle the exception
	}
	
})


// 查看详细菜单
router.get('/vieworder',new Auth().m,async ctx=>{
	let {id} = ctx.query
	console.log("50",id);
	// const query = `db.collection('')`
	const query = `db.collection('order_data').doc('${id}').field({menu:true}).get()`
	try{
		const res = await new getToken().postever(Tripurl,query)
		const data = res.data.map(item=>{return JSON.parse(item)})
		console.log(data);
		new result(ctx,'SUCCESS',200,data[0].menu).answer()
		
	}catch(e){
		console.log(e);
		new result(ctx,'服务器端发生错误',500).answer()
		//TODO handle the exception
	}
})

// 已接单
router.get('/receiving',new Auth().m,async ctx=>{
	let {id} = ctx.query;
	const query = `db.collection('order_data').doc('${id}').update({data:{order_receiving:'rec_order'}})`
	try{
		await new getToken().postever(Updateurl,query)
		new result(ctx,'接单了，快点上菜哦',200).answer()
	}catch(e){
		new result(ctx,'服务器端发生错误',500).answer()
		//TODO handle the exception
	}
	
})

// 结账及推送订阅消息
router.get('/checkout',new Auth().m,async ctx=>{
	let {id,openid,sett_amount,order_no} = ctx.query;
	console.log(Price(23));
	let newmoney = Price(Number(sett_amount))
	// 订阅消息字段组合、
	let time = moment().utcOffset(8).format('YYYY-MM-DD HH:mm:ss')
	let subscribe = {'amount1':{'value':newmoney},'time2':{'value':time},'character_string3':{'value':order_no}}
	const query = `db.collection('order_data').doc('${id}').update({data:{transac_status:'success'}})`
	try{
		await new getToken().subscribe(openid,subscribe)
		await new getToken().postever(Updateurl,query)
		new result(ctx,'结账成功啦').answer()
		
	}catch(e){
		new result(ctx,'服务器端发生错误',500).answer()
		//TODO handle the exception
	}
	
})


module.exports = router.routes()