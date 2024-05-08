import { ImageResponse } from 'next/og'

// TODO
export function GET(request: Request) {
  let url = new URL(request.url)
  let title = url.searchParams.get('title') || 'Max Stoiber (@mxstbr)'

  return new ImageResponse(
    (
      <div tw="flex flex-col w-full h-full items-center justify-center bg-white">
        <div tw="flex flex-col md:flex-row w-full py-12 px-4 md:items-center justify-between p-8">
          <h2
            tw="flex flex-col text-8xl font-bold text-center mx-auto"
            style={{ textWrap: 'balance' }}
          >
            {title}
          </h2>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
