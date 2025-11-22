// Clear localStorage on app load
if (typeof window !== 'undefined') {
  localStorage.removeItem('instagram_posts')
  localStorage.clear()
  console.log('✅ localStorage cleared')
}