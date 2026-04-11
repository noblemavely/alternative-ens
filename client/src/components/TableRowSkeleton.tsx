export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <tr key={i} className="border-b">
          {Array.from({ length: columns }).map((_, j) => (
            <td key={j} className="py-3 px-4">
              <div className="h-4 bg-muted rounded-sm animate-pulse" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
