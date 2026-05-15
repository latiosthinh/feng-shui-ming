export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-amber-50 p-4">
      <div className="text-center space-y-6">
        <div className="text-8xl">☯</div>
        <h1 className="text-4xl font-bold text-gray-800">404</h1>
        <p className="text-gray-600 text-lg">页面未找到 / Page not found</p>
        <p className="text-gray-500">ページが見つかりません / 페이지를 찾을 수 없습니다 / Không tìm thấy trang</p>
        <a
          href="/"
          className="inline-block px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
        >
          返回首页 / Go Home
        </a>
      </div>
    </div>
  )
}
