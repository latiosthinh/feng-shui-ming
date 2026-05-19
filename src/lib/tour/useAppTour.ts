'use client'
import { useCallback } from 'react'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'

const TOUR_KEY = 'fengshuiming-tour-completed'

type TourMode = 'form' | 'chat'

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
        description: 'Nhấn trái tim để lưu tên vào danh sách yêu thích. Bạn có thể lưu tối đa 9 tên ở gói miễn phí.',
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
      element: '[data-tour="chat"]',
      popover: {
        title: '💬 Trò chuyện AI',
        description:
          'Cần gợi ý thêm? Nhấn vào đây để trò chuyện với trợ lý AI. Bạn có thể mô tả sở thích bằng ngôn ngữ tự nhiên!',
        side: 'left',
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

function buildChatTour(): TourStep[] {
  return [
    {
      popover: {
        title: '🎉 Chào mừng bạn!',
        description:
          'Đây là giao diện trò chuyện AI. Bạn có thể mô tả mong muốn của mình bằng ngôn ngữ tự nhiên, và tôi sẽ gợi ý những tên phù hợp!',
        side: 'bottom',
      },
    },
    {
      element: '[data-tour="chat-input"]',
      popover: {
        title: '💬 Bắt đầu trò chuyện',
        description:
          'Nhập mô tả về tên bạn mong muốn. Ví dụ: "Gợi ý tên cho bé trai họ Nguyễn, sinh năm 2024, mong muốn thông minh và tài giỏi."',
        side: 'top',
      },
    },
    {
      element: '[data-tour="chat-send"]',
      popover: {
        title: '📨 Gửi tin nhắn',
        description: 'Nhấn nút này để gửi yêu cầu. Hệ thống sẽ tạo tên dựa trên mô tả của bạn.',
        side: 'left',
      },
    },
    {
      element: '[data-tour="chat-names"]',
      popover: {
        title: '📇 Kết quả tên',
        description:
          'Các tên sẽ hiển thị ở đây. Bạn có thể nhấn ❤️ để lưu hoặc 📖 để xem phân tích chi tiết từng tên.',
        side: 'top',
      },
    },
    {
      element: '[data-tour="chat-suggestions"]',
      popover: {
        title: '💡 Gợi ý nhanh',
        description:
          'Bạn có thể nhấn vào các gợi ý bên dưới để khám phá thêm nhiều lựa chọn khác nhau.',
        side: 'top',
      },
    },
    {
      popover: {
        title: '🎯 Bắt đầu thôi!',
        description:
          'Bạn đã sẵn sàng! Hãy nhập yêu cầu đầu tiên của bạn nhé. Nếu muốn chuyển sang giao diện biểu mẫu, bạn có thể nhấn nút 📝 ở góc trên bên phải.',
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

  const startTour = useCallback((mode: TourMode) => {
    const steps = mode === 'form' ? buildFormTour() : buildChatTour()

    const driverObj = driver({
      showProgress: true,
      steps: steps.map((step) => ({
        element: step.element,
        popover: {
          title: step.popover.title,
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

    // Small delay to ensure DOM is ready
    setTimeout(() => driverObj.drive(), 500)
  }, [])

  const resetTour = useCallback(() => {
    try {
      localStorage.removeItem(TOUR_KEY)
    } catch {}
  }, [])

  return { startTour, resetTour, hasCompletedTour }
}
