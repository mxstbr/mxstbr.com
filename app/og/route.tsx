import { ImageResponse } from 'next/og'
import type { SatoriOptions } from 'next/dist/compiled/@vercel/og/satori'

async function getFonts(): Promise<SatoriOptions['fonts']> {
  const [interRegular, interBold] = await Promise.all([
    fetch(new URL('./Inter-Regular.woff', import.meta.url)).then((res) =>
      res.arrayBuffer(),
    ),
    fetch(new URL('./Inter-Bold.woff', import.meta.url)).then((res) =>
      res.arrayBuffer(),
    ),
  ])

  return [
    {
      name: 'Inter',
      data: interRegular,
      style: 'normal',
      weight: 400,
    },
    {
      name: 'Inter',
      data: interBold,
      style: 'normal',
      weight: 700,
    },
  ]
}

export const runtime = 'edge'

export async function GET(request: Request) {
  let url = new URL(request.url)
  let title = url.searchParams.get('title')
  const root = !title
  let subtitle = url.searchParams.get('subtitle')
  let name = url.searchParams.get('name')

  return new ImageResponse(
    (
      <div
        tw="flex flex-col w-full h-full items-center justify-center bg-slate-50 text-slate-900"
        style={{ fontFamily: '"Inter"' }}
      >
        <div tw="absolute top-0 left-0 right-0 flex flex-row w-full justify-between items-center px-16 pt-8 text-slate-500">
          <h1 tw="font-normal text-3xl">
            {name || (root ? 'mxstbr.com' : 'Sonjeet Paul')}
          </h1>
          <p tw="text-3xl">@mxstbr</p>
        </div>
        <div tw="flex flex-col items-center px-16">
          <h2
            tw="flex flex-col text-7xl font-bold text-center"
            style={{ textWrap: 'balance' }}
          >
            {root ? 'Sonjeet Paul' : title}
          </h2>
          <div tw={`text-3xl text-slate-500 ${root ? '' : 'mt-2'}`}>
            {root ? 'CEO & Co-Founder, Stellate' : subtitle}
          </div>
        </div>
        {/* <div tw="absolute bottom-0 left-0 right-0 flex flex-row w-full justify-between items-center px-16 pb-8 text-3xl"></div> */}
      </div>
    ),
    {
      fonts: await getFonts(),
    },
  )
}
