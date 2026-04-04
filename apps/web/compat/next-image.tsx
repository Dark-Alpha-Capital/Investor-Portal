import * as React from 'react'

type NextImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  src: string
  alt: string
  width?: number | string
  height?: number | string
}

const Image = React.forwardRef<HTMLImageElement, NextImageProps>((props, ref) => {
  return <img ref={ref} {...props} />
})

Image.displayName = 'NextImageCompat'

export default Image
