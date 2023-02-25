const router = require('koa-router')()		
//注册  登录 接口 

// 引入统一给前端返回的body响应
const result = require('../../config/result')
// 操作数据库接口
const {getToken,Addurl,Tripurl} = require('../../config/databaseapi')
// 校验
const {checking,regcheck} = require('../../config/checking')

// 生成token
const {gettoken} =  require('../../token/jwt')
// 解析token合法性
const {Auth} = require('../../token/auth')

// 注册
router.post('/register',async ctx=>{
	// post提交的值在  ctx.request.body
	// console.log(ctx.request.body)
	let {account,password} = ctx.request.body
	// 1.校验前端传来的值是否合法
	new regcheck(ctx,account,password).start()
	// console.log(123);
	// 2.查询手机号码之前是否注册过
	const query = `db.collection('business-acc').where({account:'${account}'}).get()`
	try{
		const user = await new getToken().postever(Tripurl,query)
		// console.log("25",user);
		if(user.data.length >0){
			// 已注册过
			new result(ctx,'注册过了',200).answer()
		}else{
			// 没注册过
			// 生成商家唯一标识uid
			const uid = new Date().getTime()
			// console.log(uid);
			const struid = JSON.stringify(uid)
			// console.log(struid);
			const OBJ = {account,password,uid:struid}
			const STR = JSON.stringify(OBJ)
			const addquery = `db.collection('business-acc').add({data:${STR}})`
			const res = await new getToken().postever(Addurl,addquery)
			// console.log(res);
		}
		
	}catch(e){
		new result(ctx,'注册失败').answer()
	}
	
	
})

// 登录
router.post('/login',async ctx=>{
	let {account,password} = ctx.request.body
	const query = `db.collection('business-acc').where({account:'${account}',password:'${password}'}).get()`
	try{
		const user = await new getToken().postever(Tripurl,query)
		// console.log("57",user);
		if(user.data.length ==0){
			new result(ctx,'账号或密码错误',202).answer()
		}else{
			const OBJ = JSON.parse(user.data[0])
			// console.log(OBJ)
			new result(ctx,'登录成功',200,{token:gettoken(OBJ.uid)}).answer()
		}
	}catch(e){
		new result(ctx,'登录失败，服务器发送错误',500).answer()
	}
})

// 验证token
router.get('/ceshi',new Auth().m,async ctx=>{
	// console.log(123);
	console.log(ctx.auth.uid);
	
})

module.exports = router.routes()