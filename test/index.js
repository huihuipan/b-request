const assert = require('assert')

const Request = require('../src/index')

const serve = require('./server/index') 


class httpRequest extends Request {
  constructor() {
    super()
  }
  baseRequest(method, api, params) {
    if (serve[api]) {
      return serve[api](method, params)
    } else {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          reject(
            serve.http400()
          )
        }, 1000)
      })
    }
  }
  handleResultCode(res, fnSuccess, fnError) {
    const { code, data, message } = res
    if (code === 200) {
      fnSuccess(res)
    } else if (code === 404) {
      fnError(res)
    } else if (code === 10001) {
      console.log('跳转登录....................')
      fnError(res)
    } else {
      fnError(res)
    }
  }
}


// let time = 0
// let timer = setInterval(() => {
//   console.log('请求等待..........' + (time += 1) + '秒')
//   if (time > 60) {
//     clearInterval(timer)
//   }
// }, 1000)


const request = new httpRequest()

function throwError(rightRes, currentRes) {
  const strRightRes = JSON.stringify(rightRes, null, 2)
  const strCurrentRes = JSON.stringify(currentRes, null, 2)
  if (strRightRes !== strCurrentRes) {
    throw new Error(`
期望>>>>>>>>>>>>>>>>>>>>>>>>>>
${ strRightRes }
当前<<<<<<<<<<<<<<<<<<<<<<<<<<
${ strCurrentRes }
    `)
  }
}
 
describe('/test/index', function () {
      
  describe('测试mock服务', function () {
    it('测试单次创建数据', async function() {
      const res = await request.post('create', { name: '斯提芬大狗' })

      const rightResult = {
        info: {
          name: '斯提芬大狗',
          id: 1
        }
      }
      return throwError(rightResult, res)
    })

    it('测试单次获取列表', async function() {
      const res = await request.get('getList', { page: 1 })
      const rightResult = {
        list: [
          { name: '斯提芬大狗', id: 1 }
        ],
        page: {
          page: 1,
          size:2,
          total:1,
          pages:1
        }
      }
      return throwError(rightResult, res)
    })

    it('测试单次修改数据', async function() {
      const res = await request.post('update', { id: 1, name: '斯提芬大猫' })
      const rightResult = {
        info: {
          name: '斯提芬大猫',
          id: 1
        }
      }
      return throwError(rightResult, res)
    })
    
    it('测试单次获取详情', async function() {
      const res = await request.get('getInfo', { id: 1 })
      const rightResult = {
        info: {
          name: '斯提芬大猫',
          id: 1
        }
      }
      return throwError(rightResult, res)
    })

    it('测试单次删除数据', async function() {
      const res = await request.post('remove', { id: 1 })
      const rightResult = {
        info: 'success'
      }
      return throwError(rightResult, res)
    })

    it('测试单次清空数据', async function() {
      const res = await request.post('clear')
      const rightResult = {
        info: 'success'
      }
      return throwError(rightResult, res)
    })

    it('测试服务错误', async function() {
      try {
        await request.get('mockServerError')
      } catch (error) {
        const rightResult = {
          "code": 400,
          "message": '服务器错误'
        }
        return throwError(rightResult, error)
      }
    })

    it('测试不存在的接口', async function() {
      try {
        await request.get('someServeNotFound')
      } catch (error) {
        const rightResult = {
          "statusCode": 404,
          "data": {},
          "errMsg": "request:error",
          "dataFrom": "request"
        }
        return throwError(rightResult, error)
      }
    })

  })

  describe('并发测试', function() {
    it('测试并发创建', async function() {
      const create1 = request.post('create', { name: '斯提芬大狗' })
      const create2 = request.post('create', { name: '斯提芬大猫' })
      const create3 = request.post('create', { name: '斯提芬大鼠' })
  
      const id1 = await create1
      const id2 = await create2
      const id3 = await create3
      
      const res = await request.get('getList', { page: 1 })
  
      const rightResult = JSON.stringify({
        list: [
          id1.info,
          id2.info,
        ],
        page: {
          page: 1,
          size: 2,
          total: 3,
          pages: 2,
        }
      })
  
      if (JSON.stringify(res) !== rightResult) {
        throw new Error(`
          返回值不正确,
          期望：${ rightResult }
          当前：${ JSON.stringify(res) }
        `)
      }
    })
    
    it('测试重复提交', async function() {
      const rightResult = JSON.stringify({
        code: '403',
        message: 'Resubmit!',
      })
      const create4 = request.post('create', { name: '斯提芬大猪' })
      const create5 = request.post('create', { name: '斯提芬大猪' })

      const id4 = await create4
      try {
        const id5 = await create5
      } catch (error) {
        if (JSON.stringify(error) !== rightResult) {
          throw new Error(`
            返回值不正确,
            期望：${ rightResult }
            当前：${ JSON.stringify(error) }
          `)
        }
      }
    })

    it('测试并发获取', async function() {
      const rightResult = JSON.stringify({
        list: [
          { name: '斯提芬大狗', id: 1 },
          { name: '斯提芬大猫', id: 2 },
          { name: '斯提芬大鼠', id: 3 },
          { name: '斯提芬大猪', id: 4 },
        ],
        page: {
          page: 1,
          size: 10,
          total: 4,
          pages: 1,
        }
      })

      const getList1 = request.get('getList', { page: 1, size: 10 })
      const getList2 = request.get('getList', { page: 1, size: 10 })
      
      const list1 = await getList1
      const list2 = await getList2
      
      if ((JSON.stringify(list1) !== JSON.stringify(list2)) || (JSON.stringify(list1) !== rightResult)) {
        throw new Error(`
          返回值不正确,
          期望：${ rightResult }
          当前：${ JSON.stringify(list1) }
        `)
      }
      
    })
    it('测试列表缓存', async function() {
      const rightResult = JSON.stringify({
        list: [
          { name: '斯提芬大狗', id: 1 },
          { name: '斯提芬大猫', id: 2 },
          { name: '斯提芬大鼠', id: 3 },
          { name: '斯提芬大猪', id: 4 },
        ],
        page: {
          page: 1,
          size: 10,
          total: 4,
          pages: 1,
        }
      })

      const getListCache = request.get('getList', { page: 1, size: 10 })
      
      const res = await getListCache
      
      if (JSON.stringify(res) !== rightResult) {
        throw new Error(`
          返回值不正确,
          期望：${ rightResult }
          当前：${ JSON.stringify(res) }
        `)
      }
       
    })


  })
})
