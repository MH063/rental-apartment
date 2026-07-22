const TOKEN_KEY = 'token'
const REFRESH_TOKEN_KEY = 'refresh_token'

const API_BASE = 'http://localhost:8787'

function request({ url, method = 'GET', data, loading = true }) {
  if (loading) {
    wx.showLoading({ title: '加载中...' })
  }

  const token = wx.getStorageSync(TOKEN_KEY)

  return new Promise((resolve, reject) => {
    wx.request({
      url: API_BASE + url,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
      },
      success(res) {
        if (res.data.success) {
          resolve(res.data.data)
        } else if (res.statusCode === 401) {
          refreshToken().then(() => {
            resolve(request({ url, method, data, loading: false }))
          }).catch(() => {
            wx.removeStorageSync(TOKEN_KEY)
            wx.removeStorageSync(REFRESH_TOKEN_KEY)
            wx.redirectTo({ url: '/pages/login/login' })
            reject(res.data.error)
          })
        } else {
          wx.showToast({ title: res.data.error || '请求失败', icon: 'none' })
          reject(res.data.error)
        }
      },
      fail(err) {
        wx.showToast({ title: '网络异常', icon: 'none' })
        reject(err)
      },
      complete() {
        if (loading) wx.hideLoading()
      },
    })
  })
}

function refreshToken() {
  const refreshToken = wx.getStorageSync(REFRESH_TOKEN_KEY)
  if (!refreshToken) return Promise.reject('no refresh token')
  return new Promise((resolve, reject) => {
    wx.request({
      url: API_BASE + '/api/auth/refresh',
      method: 'POST',
      data: { refresh_token: refreshToken },
      success(res) {
        if (res.data.success) {
          wx.setStorageSync(TOKEN_KEY, res.data.data.access_token)
          wx.setStorageSync(REFRESH_TOKEN_KEY, res.data.data.refresh_token)
          resolve()
        } else {
          reject(res.data.error)
        }
      },
      fail: reject,
    })
  })
}

module.exports = { request, API_BASE }
