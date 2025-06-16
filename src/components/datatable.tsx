"use client";

import * as React from "react";
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
} from "@/components/icons";

import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/configFirebase";

type RowData = {
  id: string; // Firestore document ID
  comment: string;
  label: string;
};

// Kolom tabel
const columns = [
  {
    accessorKey: "comment",
    header: "Komentar",
  },
  {
    accessorKey: "label",
    header: "Label",
  },
];

export function DataTable({ data: initialData }: { data: RowData[] }) {
  const [data, setData] = React.useState(() => initialData);
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // State edit
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editComment, setEditComment] = React.useState("");
  const [editLabel, setEditLabel] = React.useState("");

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  // Fungsi untuk simpan hasil edit ke Firestore dan update state lokal
  const saveEdit = async () => {
    if (!editingId) return;
    if (!editComment.trim() || !editLabel.trim()) return;

    try {
      // Update di Firestore
      await updateDoc(doc(db, "komentar", editingId), {
        comment: editComment,
        label: editLabel,
        updatedAt: serverTimestamp(),
      });

      // Update state lokal
      setData((prev) =>
        prev.map((item) =>
          item.id === editingId
            ? { ...item, comment: editComment, label: editLabel }
            : item
        )
      );

      setEditingId(null);
      setEditComment("");
      setEditLabel("");
    } catch (error) {
      console.error("Gagal update komentar:", error);
    }
  };

  return (
    <>
      <Table>
        <TableHeader className="bg-muted sticky top-0 z-10">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} colSpan={header.colSpan}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
              <TableHead>Aksi</TableHead>
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => {
              const isEditing = editingId === row.id;

              return (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => {
                    if (cell.column.id === "comment") {
                      return (
                        <TableCell key={cell.id}>
                          {isEditing ? (
                            <Input
                              value={editComment}
                              onChange={(e) => setEditComment(e.target.value)}
                            />
                          ) : (
                            flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )
                          )}
                        </TableCell>
                      );
                    }

                    if (cell.column.id === "label") {
                      return (
                        <TableCell key={cell.id}>
                          {isEditing ? (
                            <Select
                              value={editLabel}
                              onValueChange={setEditLabel}
                            >
                              <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder="Pilih label" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Anger">Anger</SelectItem>
                                <SelectItem value="Happy">Happy</SelectItem>
                                <SelectItem value="Sadness">Sadness</SelectItem>
                                <SelectItem value="Love">Love</SelectItem>
                                <SelectItem value="Neutral">Neutral</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )
                          )}
                        </TableCell>
                      );
                    }

                    return (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    );
                  })}

                  <TableCell>
                    {isEditing ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mr-2"
                          onClick={saveEdit}
                        >
                          Save
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingId(row.id);
                          setEditComment(row.original.comment);
                          setEditLabel(row.original.label);
                        }}
                      >
                        Edit
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length + 1}
                className="h-24 text-center"
              >
                Tidak ada komentar.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 mt-4">
        <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
          {table.getFilteredSelectedRowModel().rows.length} dari{" "}
          {table.getFilteredRowModel().rows.length} data dipilih.
        </div>
        <div className="flex w-full items-center gap-8 lg:w-fit">
          <div className="flex w-fit items-center justify-center text-sm font-medium">
            Halaman {table.getState().pagination.pageIndex + 1} dari{" "}
            {table.getPageCount()}
          </div>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <IconChevronsLeft />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <IconChevronLeft />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <IconChevronRight />
            </Button>
            <Button
              variant="outline"
              className="hidden size-8 lg:flex"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <IconChevronsRight />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
