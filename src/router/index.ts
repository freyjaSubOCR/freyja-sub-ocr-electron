import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import Start from '../views/Start.vue'
import MainWindow from '../views/MainWindow.vue'

Vue.use(VueRouter)

const routes: Array<RouteConfig> = [
    {
        path: '/',
        name: 'Start',
        component: Start
    },
    {
        path: '/MainWindow',
        name: 'MainWindow',
        component: MainWindow
    }
]

const router = new VueRouter({
    mode: process.env.IS_ELECTRON ? 'hash' : 'history',
    base: process.env.BASE_URL,
    routes
})

export default router
