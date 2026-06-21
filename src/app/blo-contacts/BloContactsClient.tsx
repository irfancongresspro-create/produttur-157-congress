'use client'

import React, { useState, useMemo } from 'react'
import data from '@/data/blo_contacts.json'

type SortField = 'part_no' | 'name' | 'sl_no' | 'total_electors'
type SortOrder = 'asc' | 'desc'

export default function BloContactsClient() {
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<SortField>('part_no')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const filteredAndSorted = useMemo(() => {
    let result = data.filter(row => {
      const q = search.toLowerCase()
      return (
        row.name.toLowerCase().includes(q) ||
        row.part_no.toString().includes(q) ||
        row.mobile.includes(q)
      )
    })

    result = result.sort((a, b) => {
      let aVal = a[sortField]
      let bVal = b[sortField]
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      } else {
        return sortOrder === 'asc'
          ? (aVal as number) - (bVal as number)
          : (bVal as number) - (aVal as number)
      }
    })

    return result
  }, [search, sortField, sortOrder])

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', color: 'white' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px', color: '#f87171' }}>
        BLO Contacts
      </h1>
      <p style={{ color: '#9ca3af', marginBottom: '24px' }}>
        Directory of Booth Level Officers for Proddatur 157.
      </p>

      {/* Search Bar */}
      <div style={{ marginBottom: '24px' }}>
        <input
          type="text"
          placeholder="Search by BLO Name, Part No, or Mobile..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '8px',
            border: '1px solid #374151',
            backgroundColor: '#1f2937',
            color: 'white',
            fontSize: '16px',
            outline: 'none',
          }}
        />
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', backgroundColor: '#111827', borderRadius: '8px', border: '1px solid #374151' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#1f2937', borderBottom: '1px solid #374151' }}>
              <th 
                onClick={() => handleSort('part_no')}
                style={{ padding: '12px 16px', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                Part No {sortField === 'part_no' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th 
                onClick={() => handleSort('name')}
                style={{ padding: '12px 16px', cursor: 'pointer' }}
              >
                Name of the BLO {sortField === 'name' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th style={{ padding: '12px 16px' }}>Mobile No.</th>
              <th 
                onClick={() => handleSort('total_electors')}
                style={{ padding: '12px 16px', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                Total Electors {sortField === 'total_electors' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSorted.map((row, i) => (
              <tr 
                key={row.sl_no} 
                style={{ 
                  borderBottom: i === filteredAndSorted.length - 1 ? 'none' : '1px solid #374151',
                  backgroundColor: i % 2 === 0 ? '#111827' : '#1f2937'
                }}
              >
                <td style={{ padding: '12px 16px', fontWeight: 'bold' }}>{row.part_no}</td>
                <td style={{ padding: '12px 16px' }}>{row.name}</td>
                <td style={{ padding: '12px 16px' }}>
                  {row.mobile ? (
                    <a 
                      href={`tel:${row.mobile}`} 
                      style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: '500' }}
                    >
                      📞 {row.mobile}
                    </a>
                  ) : '-'}
                </td>
                <td style={{ padding: '12px 16px' }}>{row.total_electors}</td>
              </tr>
            ))}
            {filteredAndSorted.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: '#9ca3af' }}>
                  No BLOs found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
