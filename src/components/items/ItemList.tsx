'use client'

import { useState, useEffect } from 'react'
import type { FamilyItem } from '@/core/models/familyItem'
import ItemCard from './ItemCard'

interface ItemListProps {
  initialItems?: FamilyItem[]
  filters?: {
    status?: string
    type?: string
    kidId?: string
  }
}

export default function ItemList({ initialItems = [], filters = {} }: ItemListProps) {
  const [items, setItems] = useState<FamilyItem[]>(initialItems)
  const [loading, setLoading] = useState(!initialItems.length)

  useEffect(() => {
    if (initialItems.length) return

    const fetchItems = async () => {
      try {
        const params = new URLSearchParams()
        if (filters.status) params.set('status', filters.status)
        if (filters.type) params.set('type', filters.type)
        if (filters.kidId) params.set('kidId', filters.kidId)

        const response = await fetch(`/api/items?${params.toString()}`)
        if (!response.ok) throw new Error('Failed to fetch items')

        const data = await response.json()
        setItems(data.items || [])
      } catch (error) {
        console.error('Error fetching items:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchItems()
  }, [filters, initialItems.length])

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading items...</div>
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No items found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  )
}
