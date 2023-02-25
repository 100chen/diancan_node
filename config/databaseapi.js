const axios = require('axios')
const qs = require('querystring')

const result = require('./handle')

// 拼接tokenurl 地址
let params = qs.stringify({
	grant_type:'client_credential',
	appid:'改为你自己的',
	secret:'改为你自己的'
	
})

// 获取token的地址  必须是得到token才有权限对云开发数据库进行操作
let url = 'https://api.weixin.qq.com/cgi-bin/token?' + params

// 拿到云环境id
let env = 'cloudee-6gy24vzm4308e89b'

// 数据库插入记录
let Addurl = 'https://api.weixin.qq.com/tcb/databaseadd?access_token='
// 数据库查询记录
let Tripurl = 'https://api.weixin.qq.com/tcb/databasequery?access_token='

// 数据库更新记录
let Updateurl = 'https://api.weixin.qq.com/tcb/databaseupdate?access_token='

// 订阅消息
let Subscribe = 'https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token='

// 小程序码接口
let Qrcode = 'https://api.weixin.qq.com/wxa/getwxacode?access_token='

class getToken{
	constructor(){
		
	}
	// 获取token
	async gettoken(){
		try{
			// await接收到axios返回的结果，不用then catch
			let token = await axios.get(url)
			console.log("43",token)
			if(token.status == 200){
				return token.data.access_token
			}else{
				throw '获取token错误'
			}
		}catch(e){
			// console.log(e)
			throw new result(e,500)
		}
	}
	
	// 调用云开发http  api接口
	// 调用云开发http api接口
	async postever(dataurl,query){
		try{
			let token = await this.gettoken()
			let data = await axios.post(dataurl + token,{env,query})
			// console.log("52",data)
			if(data.data.errcode == 0){
				return data.data
			}else {
				throw '请求出错'
			}
		}catch(e){
			// console.log("59",e)
			throw new result(e,500)
		}
	}
	
	
	// 订阅消息
	async subscribe(touser,data){
		try{
			let token = await this.gettoken()
			let OBJ = {touser,data,template_id:'qip2S5bL2P_Af7nflfmUJGelyouRdyq6eL_iWW4xnu8',page:'pages/my-order/my-order',miniprogram_state:'developer'}
			let colldata = await axios.post(Subscribe + token,OBJ)
			console.log(colldata);
		}catch(e){
			console.log(e)
			//TODO handle the exception
		}
	}
	
	// 生成小程序码
	async qrcode(number){
		let token = await this.gettoken()
		let OBJ = JSON.stringify({path:'pages/index/index?number='+ number}) 
		try{
			let colldata = await axios.post(Qrcode+token,OBJ,{responseType:'arraybuffer'})
			return colldata
		}catch(e){
			throw new result(e,500)
		}
		
	}
}

module.exports = {getToken,Addurl,Tripurl,Updateurl}