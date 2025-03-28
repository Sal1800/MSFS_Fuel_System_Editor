

import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
// import * as Icons from '@element-plus/icons'
import './assets/main.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import App from './App.vue'

const app = createApp(App)

app.use(ElementPlus)
// app.use(Icons)
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.mount('#app')
