'use client'
import { useCallback } from 'react'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import './tour-styles.css'

const TOUR_KEY = 'fengshuiming-tour-completed'

interface TourStep {
  element?: string
  popover: {
    title: string
    description: string
    side?: 'top' | 'bottom' | 'left' | 'right'
    align?: 'start' | 'center' | 'end'
  }
}

function buildFormTour(): TourStep[] {
  return [
    {
      popover: {
        title: '🎉 Chào mừng bạn!',
        description:
          'Đây là công cụ giúp bạn đặt tên cho bé dựa trên phong thủy truyền thống. Hãy để tôi hướng dẫn bạn từng bước nhé!',
        side: 'bottom',
      },
    },
    {
      element: '[data-tour="surname"]',
      popover: {
        title: '📝 Bước 1: Nhập họ',
        description: 'Nhập họ của bé vào đây. Bạn cũng có thể để trống để hệ thống tự động chọn họ phổ biến.',
        side: 'bottom',
      },
    },
    {
      element: '[data-tour="gender"]',
      popover: {
        title: '👶 Bước 2: Chọn giới tính',
        description: 'Chọn giới tính để hệ thống gợi ý tên phù hợp hơn với bé yêu của bạn.',
        side: 'bottom',
      },
    },
    {
      element: '[data-tour="birth"]',
      popover: {
        title: '📅 Bước 3: Ngày giờ sinh',
        description:
          'Nhập ngày giờ sinh để phân tích Bát Tự và Ngũ Hành chính xác nhất. Không bắt buộc nhưng khuyến khích!',
        side: 'bottom',
      },
    },
    {
      element: '[data-tour="submit"]',
      popover: {
        title: '🚀 Bước 4: Tạo tên',
        description:
          'Nhấn nút này để bắt đầu! Hệ thống sẽ tạo ra các tên may mắn kèm phân tích phong thủy chi tiết.',
        side: 'top',
      },
    },
    {
      element: '[data-tour="results"]',
      popover: {
        title: '✨ Kết quả',
        description:
          'Kết quả sẽ hiển thị ở đây. Mỗi tên đi kèm với phân tích phong thủy, ngũ cách, và ý nghĩa chi tiết.',
        side: 'top',
      },
    },
    {
      element: '[data-tour="favorite"]',
      popover: {
        title: '❤️ Lưu tên yêu thích',
        description:
          'Nhấn trái tim để lưu tên vào danh sách yêu thích. Bạn cũng có thể chia sẻ danh sách với ông bà để cả nhà cùng bình chọn.',
        side: 'left',
      },
    },
    {
      element: '[data-tour="analysis-buttons"]',
      popover: {
        title: '📊 Phân tích chi tiết',
        description:
          'Nhấn các nút này để xem phân tích chuyên sâu: Phong thủy, Số mệnh, Bát Tự, Cung hoàng đạo, và Kinh Dịch.',
        side: 'top',
      },
    },
    {
      element: '[data-tour="advanced-settings"]',
      popover: {
        title: '⚙️ Cài đặt nâng cao',
        description:
          'Mở rộng để điều chỉnh số lượng tên, độ dài tên, và bật các tính năng như bộ tên anh chị em, tên đệm truyền thống, gợi ý biệt danh, và tên tiếng Anh.',
        side: 'top',
      },
    },
    {
      popover: {
        title: '🎯 Bắt đầu thôi!',
        description:
          'Bạn đã sẵn sàng! Hãy bắt đầu tạo tên cho bé yêu của mình nhé. Nếu cần hỗ trợ thêm, bạn luôn có thể xem lại hướng dẫn này trong menu người dùng.',
      },
    },
  ]
}

export function useAppTour() {
  const hasCompletedTour = useCallback((): boolean => {
    if (typeof window === 'undefined') return true
    try {
      return localStorage.getItem(TOUR_KEY) === 'true'
    } catch {
      return false
    }
  }, [])

  const startTour = useCallback(() => {
    const steps = buildFormTour()
    const total = steps.length

    const driverObj = driver({
      animate: true,
      showProgress: true,
      popoverClass: 'driver-popover',
      stagePadding: 6,
      stageRadius: 14,
      doneBtnText: '✅ Hoàn tất',
      closeBtnText: '✕',
      nextBtnText: 'Tiếp theo →',
      prevBtnText: '← Quay lại',
      steps: steps.map((step, i) => ({
        element: step.element,
        popover: {
          title: `<span style="font-size:0.7rem;font-weight:600;color:#a78bfa;display:block;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.05em">Bước ${i + 1} / ${total}</span>${step.popover.title}`,
          description: step.popover.description,
          side: step.popover.side || 'bottom',
          align: step.popover.align || 'center',
        },
      })),
      onDestroyed: () => {
        try {
          localStorage.setItem(TOUR_KEY, 'true')
        } catch {}
      },
    })

    setTimeout(() => driverObj.drive(), 500)
  }, [])

  const resetTour = useCallback(() => {
    try {
      localStorage.removeItem(TOUR_KEY)
    } catch {}
  }, [])

  return { startTour, resetTour, hasCompletedTour }
}
