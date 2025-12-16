import Link from 'next/link'
import type { Kid } from '@/core/models/kid'

interface KidListProps {
  kids: Kid[]
}

export default function KidList({ kids }: KidListProps) {
  if (kids.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">No kids added yet.</p>
        <Link
          href="/kids/new"
          className="text-blue-600 hover:text-blue-700"
        >
          Add your first kid
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {kids.map((kid) => (
        <Link
          key={kid.id}
          href={`/kids/${kid.id}`}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">{kid.name}</h2>
          {kid.grade && (
            <p className="text-gray-600 text-sm mb-1">Grade: {kid.grade}</p>
          )}
          {kid.birthday && (
            <p className="text-gray-600 text-sm mb-1">
              Birthday: {new Date(kid.birthday).toLocaleDateString()}
            </p>
          )}
          {kid.notes && (
            <p className="text-gray-500 text-sm mt-2 line-clamp-2">{kid.notes}</p>
          )}
        </Link>
      ))}
    </div>
  )
}
