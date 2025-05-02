import { ImageResponse } from 'next/og'

// Image metadata
export const size = {
  width: 256,
  height: 256,
}
export const contentType = 'image/png'

// Image generation
export function Icon({ borderRadius = '0' }: { borderRadius?: string }) {
  return () => {
    // Get current day of the month
    const currentDay = new Date().getDate()

    return new ImageResponse(
      (
        // ImageResponse JSX element
        <div
          style={{
            fontSize: 200,
            background: '#e76f6f',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            borderRadius,
            letterSpacing: '-1px',
          }}
        >
          {currentDay}
        </div>
      ),
      // ImageResponse options
      {
        // For convenience, we can re-use the exported icons size metadata
        // config to also set the ImageResponse's width and height.
        ...size,
      },
    )
  }
}

export default Icon({})
