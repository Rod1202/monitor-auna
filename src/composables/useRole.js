export function useRole() {
  const isAdmin = () => sessionStorage.getItem('role') === 'admin'
  const isViewer = () => sessionStorage.getItem('role') === 'viewer'
  return { isAdmin, isViewer }
}