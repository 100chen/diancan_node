const basicAuth = require('basic-auth')
const jwt = require('jsonwebtoken')
const security = require('./tokentime').security
const result = require('../config/handle')

class Auth{
	constructor(){
		
	}
	// get 取值函数  set 存值函数
	get m(){	//中间件
		return async(ctx,next)=>{
			const token = basicAuth(ctx.req)
			// console.log("14",token);
			if(!token ||!token.name){
				throw new result({errcode:'401',msg:'没有访问权限'},401)
			}
			// console.log(9055)
			try{
				var authcode = jwt.verify(token.name,security.secretkey)
				console.log(authcode);
			}catch(e){
				// console.log(e);
				if(e.name == 'TokenExpiredError'){
					throw new result({errcode:'401',msg:'账号过期，请重新登陆 '},401)
				}
				throw new result({errcode:'401',msg:'没有访问权限'},401)
			}
			
			ctx.auth = {
				uid:authcode.uid,
			}
			await next()
			// await next()
		}
	}
}
module.exports = {Auth}