// 服务器请求成功
const http200 = (data = {}) => {
  return {
    statusCode: 200,
    data,
    errMsg: 'request:ok',
  }
}

// 服务器请求失败
const http400 = (data = {}) => {
  return {
    statusCode: 404,
    data,
    errMsg: 'request:error',
  }
}

// 业务请求成功
const serve200 = (data = { info: 'success' }) => {
  return http200({
    code: 200,
    message: 'success',
    data,
  })
}
// 业务请求失败
const serve400 = (err) => {
  return http200({
    code: 400,
    message: err,
  })
}


let list = []

// 传多少时间就用多少时间返回
function requestTime (time = 1000) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(serve200({ info: '用时' + time + '毫秒' }))
    }, time)
  })
}

// 创建
function create(method, info = {}) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (method !== 'post') {
        reject(serve400(
          'method is not right!'
        ))
      }

      const len = list.length
      const id = len + 1
      let nItem = {
        ...info,
        id,
      }
      list.push(nItem)
      resolve(serve200({ info: nItem }))
    }, 1000)
  })
}

// 查列表
function getList(method, { page = 1, size = 2 }) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (method !== 'get') {
        reject(serve400(
          'method is not right!'
        ))
      }
      const start = (page - 1) * size
      const end = page * size
      const total = list.length
      const nList = list.slice(start, end)
      resolve(serve200(
        {
          list: nList,
          page: {
            page,
            size,
            total,
            pages: Math.ceil(total / size),
          }
        }
      ))
    }, 1000)
  })
}

// 查详情
function getInfo(method, { id }) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (method !== 'get') {
        reject(serve400(
          'method is not right!'
        ))
      }
      const item = list.filter(item => item.id === id)[0]
      if (item) {
        resolve(serve200({ info: item }))
      } else {
        reject(serve400('id:' + id + ' is not found'))
      }
    }, 1000)
  })
}

// 修改
function update(method, info = {}) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (method !== 'post') {
        reject(serve400(
          'method is not right!'
        ))
      }
      const { id } = info
      const oItem = list.filter(item => item.id === id)[0]
      if (!oItem) {
        reject(serve400('id:' + id + 'is not found, if you want create, you should use \'create\' api'))
      } else {
        const nItem = {
          ...oItem,
          ...info,
        }
        list.forEach((item, idx) => {
          if (item.id === nItem.id) {
            list[idx] = nItem
            resolve(serve200({ info: nItem }))
          }
        })
      }
    }, 1000)
  })
}

// 删除
function remove(method, { id }) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (method !== 'post') {
        reject(serve400(
          'method is not right!'
        ))
      }
      
      let willRemoveItem
      list.forEach((item, idx) => {
        if (item.id === id) {
          willRemoveItem = list.splice(idx, 1)
        }
      })
      if (willRemoveItem[0]) {
        resolve(serve200())
      } else {
        reject(serve400('delete fail! id:' + id + 'is not found'))
      }
    }, 1000)
  })
}

// 清空
function clear(method) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (method !== 'post') {
        reject(serve400(
          'method is not right!'
        ))
      }
      this.list = []
      resolve(serve200())
    }, 1000)
  })
}

function mockServerError(method) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(notdefind)
      } catch (error) {
        reject(serve400('服务器错误'))
      }
    }, 1000)
  })
}

// 登录失效
function loginFail(method) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(http200({
        code: 10001,
        message: 'login fail!'
      }))
    }, 1000)
  })
}


module.exports = {
  http200,
  http400,
  serve200,
  serve400,
  create,
  update,
  getList,
  getInfo,
  remove,
  loginFail,
  clear,
  mockServerError,
}

