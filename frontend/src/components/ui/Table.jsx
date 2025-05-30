import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

const Table = ({ children, className = '', ...props }) => {
  return (
    <div className="table-responsive">
      <table className={className} {...props}>
        {children}
      </table>
    </div>
  );
};

const TableHeader = ({ children, className = '', ...props }) => {
  return (
    <thead className={className} {...props}>
      {children}
    </thead>
  );
};

const TableBody = ({ children, className = '', ...props }) => {
  return (
    <tbody className={className} {...props}>
      {children}
    </tbody>
  );
};

const TableRow = ({ children, className = '', clickable = false, ...props }) => {
  const rowClasses = `${clickable ? 'hover:bg-secondary-50 cursor-pointer' : ''} ${className}`;
  
  return (
    <tr className={rowClasses} {...props}>
      {children}
    </tr>
  );
};

const TableHead = ({ 
  children, 
  sortable = false, 
  sortDirection = null, 
  onSort, 
  className = '', 
  ...props 
}) => {
  const handleSort = () => {
    if (sortable && onSort) {
      const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      onSort(newDirection);
    }
  };

  const headClasses = `${sortable ? 'cursor-pointer hover:bg-secondary-100 select-none' : ''} ${className}`;

  return (
    <th className={headClasses} onClick={handleSort} {...props}>
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        {sortable && (
          <div className="flex flex-col">
            <ChevronUp 
              className={`w-3 h-3 ${sortDirection === 'asc' ? 'text-primary-600' : 'text-secondary-400'}`} 
            />
            <ChevronDown 
              className={`w-3 h-3 -mt-1 ${sortDirection === 'desc' ? 'text-primary-600' : 'text-secondary-400'}`} 
            />
          </div>
        )}
      </div>
    </th>
  );
};

const TableCell = ({ children, className = '', ...props }) => {
  return (
    <td className={className} {...props}>
      {children}
    </td>
  );
};

// Componente de tabla con funcionalidades avanzadas
const DataTable = ({
  data = [],
  columns = [],
  loading = false,
  emptyMessage = 'No hay datos disponibles',
  onRowClick,
  sortable = true,
  className = '',
  responsive = true
}) => {
  const [sortConfig, setSortConfig] = React.useState({ key: null, direction: null });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = React.useMemo(() => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Vista de cards para móvil
  const MobileCardView = () => (
    <div className="space-y-4 lg:hidden">
      {sortedData.length === 0 ? (
        <div className="text-center py-8 text-secondary-500">
          {emptyMessage}
        </div>
      ) : (
        sortedData.map((row, index) => (
          <div
            key={row.id || index}
            className={`bg-white border border-secondary-200 rounded-lg p-4 shadow-sm ${
              onRowClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
            }`}
            onClick={() => onRowClick && onRowClick(row)}
          >
            {columns.map((column) => {
              if (column.key === 'acciones') {
                return (
                  <div key={column.key} className="flex justify-end mt-3 pt-3 border-t border-secondary-100">
                    {column.render ? column.render(row, row) : row[column.key]}
                  </div>
                );
              }
              
              const value = column.render ? column.render(row, row) : row[column.key];
              if (!value && value !== 0) return null;
              
              return (
                <div key={column.key} className="flex justify-between items-center py-1">
                  <span className="text-sm font-medium text-secondary-600">{column.title}:</span>
                  <span className="text-sm text-secondary-900 text-right">{value}</span>
                </div>
              );
            })}
          </div>
        ))
      )}
    </div>
  );

  // Vista de tabla para desktop
  const DesktopTableView = () => (
    <div className="hidden lg:block">
      <Table className={className}>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column.key}
                sortable={sortable && column.sortable !== false}
                sortDirection={sortConfig.key === column.key ? sortConfig.direction : null}
                onSort={() => handleSort(column.key)}
                className={column.headerClassName}
              >
                {column.title}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center py-8 text-secondary-500">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            sortedData.map((row, index) => (
              <TableRow
                key={row.id || index}
                clickable={!!onRowClick}
                onClick={() => onRowClick && onRowClick(row)}
              >
                {columns.map((column) => (
                  <TableCell key={column.key} className={column.className}>
                    {column.render ? column.render(row, row) : row[column.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  return responsive ? (
    <>
      <MobileCardView />
      <DesktopTableView />
    </>
  ) : (
    <DesktopTableView />
  );
};

Table.Header = TableHeader;
Table.Body = TableBody;
Table.Row = TableRow;
Table.Head = TableHead;
Table.Cell = TableCell;

export { DataTable };
export default Table;
