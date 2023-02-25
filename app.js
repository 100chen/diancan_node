const Koa = require('koa')
const app = new Koa()
const json = require('koa-json')
const bodyparser = require('koa-bodyparser')
const router = require('koa-router')()		//实例化路由
const cors = require('koa2-cors')
const abnormal = require('./config/abnormal')

app.use(cors())
app.use(json())
app.use(bodyparser())
app.use(abnormal)
// 全局异常处理


// 注册  登录
const login = require('./router/login/login')
// 商家设置
const uploadres = require('./router/merchant-infor/infor')
// 菜品管理
const dish = require('./router/dish-manage/dish')
// 订单管理
const order = require('./router/order/order')
// 桌号管理
const code = require('./router/qr-vode/code')


// 配置路由接口
router.use('/api',login)
router.use('/api',uploadres)
router.use('/api',dish)
router.use('/api',order)
router.use('/api',code)

// 启动路由
app.use(router.routes()).use(router.allowedMethods())




// 自定义端口号  不重复跟其他端口一样
app.listen(5000)
console.log('成功');