const multer = require('@koa/multer')

const COS = require('cos-nodejs-sdk-v5')
var cos = new COS({
    SecretId: '改为你自己的', // 推荐使用环境变量获取；用户的 SecretId，建议使用子账号密钥，授权遵循最小权限指引，降低使用风险。子账号密钥获取可参考https://cloud.tencent.com/document/product/598/37140
    SecretKey: '改为你自己的', // 推荐使用环境变量获取；用户的 SecretKey，建议使用子账号密钥，授权遵循最小权限指引，降低使用风险。子账号密钥获取可参考https://cloud.tencent.com/document/product/598/37140
	Protocol:'https:'
});

let Bucket = '改为你自己的'
let Region = '改为你自己的'

let cosfun = function(filename,path){
	return new Promise((resolve,reject)=>{
		cos.uploadFile({
			Bucket,
			Region,
			Key:'zhengshi-diancan/ '+filename,
			FilePath:path
		})
		.then(res=>{
			// console.log("22",res);
			resolve(res)
		})
		.catch(err=>{
			console.log(err);
			reject(err)
		})
	})
}

// 二进制上传
let buffer = function(filename,path){
	return new Promise((resolve,reject)=>{
		cos.putObject({
			Bucket,
			Region,
			Key:'zhengshi-diancan/ '+filename,
			Body:Buffer.from(path)
		})
		.then(res=>{
			// console.log("22",res);
			resolve(res.Location)
		})
		.catch(err=>{
			console.log(err);
			reject(err)
		})
	})
}


// 配置上传文件所在的目录  和  文件名
const storage = multer.diskStorage({	//磁盘存储引擎方法
	destination: (req,file,cb)=>{	//存储前端传来的文件
		cb(null,'upload/image')
	},
	filename: (req,file,cb) => {
		// 防止文件重名更改前缀
		let fileFormat = (file.originalname).split(".")
		// console.log(fileFormat);
		let num = `${Date.now()}-${Math.floor(Math.random(0,1)*100000)}${"."}${fileFormat[fileFormat.length -1]}`
		cb(null,num)
	}
})

const upload = multer({storage})

module.exports = {upload,cosfun,buffer}