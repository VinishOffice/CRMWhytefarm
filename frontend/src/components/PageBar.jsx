import React, { useEffect, useState } from 'react'

const PageBar = ({ setActivePage, totalData, noOfRows }) => {
    
    
  const [active, setActive] = useState(1)
  const [totalPage, setTotalPage] = useState(0)

  useEffect(() => {
    const total = Math.ceil(totalData / noOfRows)
    setTotalPage(total)  
    setActive(1)
    setActivePage(1)
  }, [totalData])

  const getPages = () => {
    let pages = []

    if (totalPage <= 5) {
      for (let i = 1; i <= totalPage; i++) pages.push(i)
    } else {
      pages.push(1) // first page

      if (active <= 3) {
        pages.push(2, 3, 4, 'dot')
      } else if (active >= totalPage - 2) {
        for (let i = totalPage - 3; i <= totalPage - 1; i++) pages.push(i)
      } else {
        pages.push(active - 1, active, active + 1, 'dot')
      }

      pages.push(totalPage) // last page
    }

    return pages
  }

  const handleClick = (p) => {
    if (p !== 'dot') {
      setActive(p)
      setActivePage(p)
    }
  }

 return (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginTop: '20px',
      justifyContent: 'center',
      flexWrap: 'wrap',
    }}
  >
    {getPages().map((p, idx) =>
      p === 'dot' ? (
        <span
          key={idx}
          style={{
            padding: '0 2px',
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#aaa',
            userSelect: 'none',
          }}
        >
          •••
        </span>
      ) : (
        <button
          key={idx}
          onClick={() => handleClick(p)}
          style={{
            minWidth: '38px',
            height: '38px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: p === active ? '#4CAF50' : '#f0f0f3',
            color: p === active ? '#fff' : '#555',
            fontWeight: '400',
            cursor: 'pointer',
            boxShadow:
              p === active
                ? 'inset 2px 2px 5px rgba(0,0,0,0.2), inset -2px -2px 5px rgba(255,255,255,0.7)'
                : '4px 4px 6px rgba(0,0,0,0.1), -4px -4px 6px rgba(255,255,255,0.7)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            if (p !== active) e.target.style.backgroundColor = '#e0e0e0'
          }}
          onMouseLeave={(e) => {
            if (p !== active) e.target.style.backgroundColor = '#f0f0f3'
          }}
        >
          {p}
        </button>
      )
    )}
  </div>
)

}

export default PageBar
