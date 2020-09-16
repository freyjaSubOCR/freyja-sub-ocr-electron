import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import Start from '../views/Start.vue'

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
        component: () => import(/* webpackChunkName: "about" */ '../views/MainWindow.vue')
    },
    {
        path: '/about',
        name: 'About',
        // route level code-splitting
        // this generates a separate chunk (about.[hash].js) for this route
        // which is lazy-loaded when the route is visited.
        component: () => import(/* webpackChunkName: "about" */ '../views/About.vue')
    }
]

const router = new VueRouter({
    mode: process.env.IS_ELECTRON ? 'hash' : 'history',
    base: process.env.BASE_URL,
    routes
})

export default router
