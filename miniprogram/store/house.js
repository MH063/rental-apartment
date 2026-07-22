const { createStore } = require('./store')
const { request } = require('../utils/request')

const houseStore = createStore({
  houses: [],
  currentHouseId: null,
  currentHouse: null,
  members: [],
  categories: [],
})

async function loadHouses() {
  const houses = await request({ url: '/api/houses' })
  const currentHouseId = getApp().globalData.currentHouseId
  const currentHouse = houses.find(h => h.id === currentHouseId)
  houseStore.setState({ houses, currentHouseId, currentHouse })
  return houses
}

async function loadMembers() {
  const houseId = houseStore.state.currentHouseId
  if (!houseId) return
  const members = await request({ url: `/api/houses/${houseId}/members` })
  houseStore.setState({ members })
}

async function loadCategories() {
  const houseId = houseStore.state.currentHouseId
  if (!houseId) return
  const categories = await request({ url: `/api/houses/${houseId}/categories` })
  houseStore.setState({ categories })
}

function switchHouse(id) {
  getApp().globalData.currentHouseId = id
  const currentHouse = houseStore.state.houses.find(h => h.id === id)
  houseStore.setState({ currentHouseId: id, currentHouse })
  loadMembers()
  loadCategories()
}

module.exports = { houseStore, loadHouses, loadMembers, loadCategories, switchHouse }
