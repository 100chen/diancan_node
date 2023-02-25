const router = require('koa-router')()
//注册  登录 接口 

// 引入统一给前端返回的body响应
const result = require('../../config/result')
// 操作数据库接口
const {
	getToken,
	Addurl,
	Tripurl,
	Updateurl
} = require('../../config/databaseapi')
// 校验
const {
	postcode
} = require('../../config/checking')

// 解析token合法性
const {
	Auth
} = require('../../token/auth')
// 上传
const {
	buffer
} = require('../../cos/cos')
// 时间模块
const moment = require('moment');
moment.locale('zh-cn')
// 二进制图片重新命名
const {
	Code
} = require('../../config/code_image')


// 添加桌号
router.post('/qrcode', new Auth().m, async ctx => {
	let {
		table
	} = ctx.request.body;
	// 校验
	new postcode(ctx, table).start()
	// 创建时间
	let time = moment().utcOffset(8).format('YYYY-MM-DD HH:mm:ss')
	// 
	try {
		// 查询该桌号是否已存在
		const query = `db.collection('table_qr_code').where({table:'${table}'}).get()`
		const res = await new getToken().postever(Tripurl, query)
		console.log(res);
		if (res.data.length > 0) {
			new result(ctx, '该桌号已存在', 202).answer()
		} else {
			let res_code = await new getToken().qrcode(table)
			// console.log("27",res_code);
			let res_image = await buffer(Code(), res_code.data)
			let code_image = 'https://' + res_image
			let table_data = `db.collection('table_qr_code').add({data:{
				time:'${time}',table:'${table}',code:'${code_image}'
			}})`
			await new getToken().postever(Addurl, table_data)
			new result(ctx, '添加成功', 200).answer()
		}
	} catch (e) {
		console.log(e);
		new result(ctx, '服务器发生错误', 500).answer()
		//TODO handle the exception
	}
})

// 请求所有桌号
router.get('/getqrcode', new Auth().m, async ctx => {
	let {
		page
	} = ctx.query;
	let sk = Number(page) * 10;
	const query = `db.collection('table_qr_code').orderBy('time','desc').limit(10).skip(${sk}).get()`

	try {
		const res = await new getToken().postever(Tripurl, query)
		let total = {
			total: res.pager.Total
		}
		const data = res.data.map(item => {
			return JSON.parse(item)
		})
		const array = {
			...{
				result: data
			},
			...total
		}
		// console.log("124",array);
		new result(ctx, 'SUCCESS', 200, array).answer()
	} catch (e) {
		//TODO handle the exception
		new result(ctx, '服务器发生错误', 500).answer()
	}

})

// 柱状图  七天销售额
router.get('/salesvolume', new Auth().m, async ctx => {
	try {
		// 最终得到的数据类型
		// let time = moment().utcOffset(8).subtract(0,'days').format('YYYY-MM-DD')
		let arr = [6, 5, 4, 3, 2, 1, 0]
		let catedays = arr.map(item => {
			return moment().utcOffset(8).subtract(item, 'days').format('YYYY-MM-DD')
		})
		let str = JSON.stringify(catedays)
		// console.log(catedays);
		// 查询数据库对应日期
		const query =
			`db.collection('seven_day_sales').where({time:db.command.in(${str})}).orderBy('time','asc').field({time:true,sales_valume:true}).get()`
		const res = await new getToken().postever(Tripurl, query)
		// console.log(res);
		const data = res.data.map(item => {
			return {
				sales_valume: JSON.parse(item).sales_valume,
				time: JSON.parse(item).time,
				unix: moment(JSON.parse(item).time).unix() //拿到时间戳，为了后面按照日历表排序
			}
		})
		// console.log(data);

		// 取到前7天
		let days = catedays.map(item => {
			return {
				sales_valume: 0,
				time: item,
				unix: moment(item).unix()
			}
		})

		// 数组对象去重
		let ab = {} //对象里不能存在相同的key值
		let obj = {}
		ab['name'] = '马云'

		// 使用reduce进行数组去重
		// 视频上看,这种遍历data得放在days前面
		let removal = [...data, ...days].reduce((prev, item) => {
			// 1.prev第一次遍历接收初始值[]  2. 可以存储上一次遍历结果
			if (!obj[item.time]) {
				prev.push(item)
				obj[item.time] = true
			}
			return prev
		}, []) //1.初始值 2. 也可以表示最终返回什么类型的数据
		console.log(removal);

		// 数组对象排序：按照unix来排序  日历表
		let res_sort = removal.sort((A, B) => {
			return (A.unix - B.unix) //- 降序  +升序
		})
		console.log(res_sort);
		new result(ctx,'success',200,res_sort).answer()
	} catch (e) {
		//TODO handle the exception
		new result(ctx,'服务器发生错误',500).answer()
	}


})



module.exports = router.routes()
