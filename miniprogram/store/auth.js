const { createStore } = require('./store')
const { request } = require('../utils/request')

const authStore = createStore({
  token: '',
  user: null,
  loading: false,
})

async function login(code) {
  authStore.setState({ loading: true })
  try {
    const res = await request({ url: '/api/auth/login', method: 'POST', data: { code } })
    wx.setStorageSync('token', res.access_token)
    wx.setStorageSync('refresh_token', res.refresh_token)
    authStore.setState({ token: res.access_token, user: { id: res.user_id }, loading: false })
    return res
  } catch (e) {
    authStore.setState({ loading: false })
    throw e
  }
}

async function loadProfile() {
  try {
    const user = await request({ url: '/api/user/profile' })
    authStore.setState({ user })
  } catch { /* ignore */ }
}

function logout() {
  const token = authStore.state.token
  if (token) {
    wx.request({
      url: 'http://localhost:8787/api/auth/logout',
      method: 'POST',
      header: { Authorization: 'Bearer ' + token },
      complete: () => {
        wx.removeStorageSync('token')
        wx.removeStorageSync('refresh_token')
        authStore.setState({ token: '', user: null })
      },
    })
  } else {
  wx.removeStorageSync('token')
  wx.removeStorageSync('refresh_token')
  authStore.setState({ token: '', user: null })
  }
}

module.exports = { authStore, login, loadProfile, logout }
