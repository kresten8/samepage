
const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { name: 'book', path: 'book/:book/:chapter?', component: () => import('pages/Book.vue') },
      { name: 'direct', path: 'direct/:book/:revision/:snippet?', component: () => import('pages/Book.vue') },
      { name: 'intro', path: 'intro', component: () => import('pages/Intro.vue') },
      { name: 'home', path: '', component: () => import('pages/Index.vue') }
    ]
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '*',
    component: () => import('pages/Index.vue')
  }
]

export default routes
