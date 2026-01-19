export const Logo = ({ className }: { className?: string }) => {
  return (
    <svg
      fill='none'
      stroke='currentColor'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth='2'
      version='1.1'
      viewBox='0 0 24 24'
      xmlns='http://www.w3.org/2000/svg'
      className={className}
    >
      <title>Read for Speed Logo</title>
      <path d='m3 1.5762a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h6a3 3 0 0 1 3 3 3 3 0 0 1 3-3h6a1 1 0 0 0 1-1v-13a1 1 0 0 0-1-1h-5a4 4 0 0 0-3.6152 2.2969c-0.24257-0.013294-0.50037-0.020959-0.77734-0.025391a4 4 0 0 0-3.6074-2.2715h-5zm8.8555 2.9395c0.097393 0.018752 0.19091 0.042122 0.2793 0.068359a4 4 0 0 0-0.13477 0.99219 4 4 0 0 0-0.14453-1.0605z' />
      <path
        d='m19 22.007h-14'
        style={{ stroke: '#c40505' }}
      />
      <text
        x='11.817075'
        y='15.005585'
        style={{
          fillRule: 'evenodd',
          fill: '#c40505',
          fontFamily: 'Times New Roman',
          fontSize: '13.38px',
          fontVariantCaps: 'normal',
          fontVariantEastAsian: 'normal',
          fontVariantLigatures: 'normal',
          fontVariantNumeric: 'normal',
          fontWeight: 'bold',
          letterSpacing: '.71677px',
          lineHeight: '0px',
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          strokeWidth: '3.351',
          stroke: 'none',
          textAlign: 'center',
          textAnchor: 'middle',
          wordSpacing: '0px',
        }}
        xmlSpace='preserve'
      >
        <tspan
          x='12.175459'
          y='15.005585'
          style={{
            fontFamily: 'Times New Roman',
            fontSize: '13.38px',
            fontVariantCaps: 'normal',
            fontVariantEastAsian: 'normal',
            fontVariantLigatures: 'normal',
            fontVariantNumeric: 'normal',
            fontWeight: 'bold',
            strokeWidth: '3.351',
          }}
        >
          R
        </tspan>
      </text>
    </svg>
  )
}
