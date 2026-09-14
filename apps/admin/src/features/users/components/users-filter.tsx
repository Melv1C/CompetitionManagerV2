import {
  Button,
  Card,
  CardContent,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui";
import { UserRole$ } from "@repo/utils";
import { Plus, RotateCcw, Search } from "lucide-react";
import { useState } from "react";

import { PAGE_SIZES, ROLES } from "../constants";
import { useUsersStore } from "../users-store";

type SelectItemConfig = {
  label: string;
  value: string;
};

const searchFieldItems: SelectItemConfig[] = [
  { label: "Email", value: "email" },
  { label: "Name", value: "name" },
];

const roleItems: SelectItemConfig[] = [
  { label: "All roles", value: "all" },
  ...ROLES.map((role) => ({
    label: role.charAt(0).toUpperCase() + role.slice(1),
    value: role,
  })),
];

const statusItems: SelectItemConfig[] = [
  { label: "All status", value: "all" },
  { label: "Active", value: "active" },
  { label: "Banned", value: "banned" },
];

const sortItems: SelectItemConfig[] = [
  { label: "Newest first", value: "createdAt-desc" },
  { label: "Oldest first", value: "createdAt-asc" },
  { label: "Name A-Z", value: "name-asc" },
  { label: "Name Z-A", value: "name-desc" },
  { label: "Email A-Z", value: "email-asc" },
  { label: "Email Z-A", value: "email-desc" },
];

const pageSizeItems: SelectItemConfig[] = PAGE_SIZES.map((size) => ({
  label: `${size} per page`,
  value: size.toString(),
}));

export function UsersFilter() {
  const filter = useUsersStore((state) => state.filter);
  const setFilter = useUsersStore((state) => state.setFilter);
  const resetFilters = useUsersStore((state) => state.resetFilters);
  const openCreateDialog = useUsersStore((state) => state.openCreateDialog);

  const [searchInput, setSearchInput] = useState(filter.searchValue);

  const handleSearch = () => {
    setFilter({ searchValue: searchInput.trim() });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleSearchFieldChange = (value: "email" | "name" | null) => {
    if (value) {
      setFilter({ searchField: value });
    }
  };

  const handleRoleChange = (value: string | null) => {
    if (value) {
      const role = value === "all" ? null : UserRole$.safeParse(value);
      setFilter({ role: role?.success ? role.data : null });
    }
  };

  const handleStatusChange = (value: string | null) => {
    if (value === "all") {
      setFilter({ banned: null });
    } else if (value === "active") {
      setFilter({ banned: false });
    } else {
      setFilter({ banned: true });
    }
  };

  const handlePageSizeChange = (value: string | null) => {
    if (value) {
      setFilter({ limit: parseInt(value, 10), offset: 0 });
    }
  };

  const handleSortChange = (value: string | null) => {
    if (value) {
      const [sortBy, sortDirection] = value.split("-") as [
        "name" | "email" | "createdAt",
        "asc" | "desc",
      ];
      setFilter({ sortBy, sortDirection });
    }
  };

  const handleReset = () => {
    setSearchInput("");
    resetFilters();
  };

  const currentStatus = filter.banned === null ? "all" : filter.banned ? "banned" : "active";
  const currentSort = `${filter.sortBy}-${filter.sortDirection}`;

  return (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4">
          {/* Top row: Search and Create button */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex flex-1 gap-2">
              <Select
                value={filter.searchField}
                onValueChange={handleSearchFieldChange}
                items={searchFieldItems}
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {searchFieldItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative flex-1">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder={`Search by ${filter.searchField}...`}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-9"
                />
              </div>
              <Button onClick={handleSearch} variant="secondary">
                Search
              </Button>
            </div>
            <Button onClick={openCreateDialog} className="gap-2">
              <Plus className="h-4 w-4" />
              Create User
            </Button>
          </div>

          {/* Filters row */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">
            <div className="space-y-1.5">
              <Label className="text-xs">Role</Label>
              <Select
                value={filter.role ?? "all"}
                onValueChange={handleRoleChange}
                items={roleItems}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  {roleItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <Select value={currentStatus} onValueChange={handleStatusChange} items={statusItems}>
                <SelectTrigger>
                  <SelectValue placeholder="All status" />
                </SelectTrigger>
                <SelectContent>
                  {statusItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Sort by</Label>
              <Select value={currentSort} onValueChange={handleSortChange} items={sortItems}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Per page</Label>
              <Select
                value={filter.limit.toString()}
                onValueChange={handlePageSizeChange}
                items={pageSizeItems}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col justify-end space-y-1.5">
              <Button variant="ghost" size="sm" onClick={handleReset} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
