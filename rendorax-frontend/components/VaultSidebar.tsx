// components/VaultSidebar.tsx
"use client";

import React, { useState, useEffect } from "react";

interface SidebarProps {
  currentFolder: string;
  activeBin: "root" | "cloud" | "vault";
  allFolders: string[];
  onFolderClick: (folderName: string) => void;
  onClientVaultRootClick: () => void;
  onBinChange: (bin: "cloud" | "vault") => void;
  onCreateFolder: () => void;
  onDeleteFolder: (folderName: string) => void;
}

type TreeNode = {
  name: string;
  path: string;
  children: Record<string, TreeNode>;
};

/** Base pixel indent per tree depth level */
const INDENT_PX = 14;

const buildTree = (paths: string[]): TreeNode => {
  const root: TreeNode = { name: "root", path: "", children: {} };

  paths.forEach((path) => {
    const cleanPath = path.replace(/\/+$/, "");
    if (!cleanPath) return;

    const parts = cleanPath.split("/");
    let current = root;
    let currentPath = "";

    parts.forEach((part) => {
      if (!part) return;
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      if (!current.children[part]) {
        current.children[part] = {
          name: part,
          path: currentPath,
          children: {},
        };
      }
      current = current.children[part];
    });
  });

  return root;
};

function TreeChildren({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`ml-[10px] border-l border-white/10 pl-[10px] ${className}`}
    >
      {children}
    </div>
  );
}

function Chevron({
  expanded,
  direction = "right",
}: {
  expanded: boolean;
  direction?: "right" | "down";
}) {
  if (direction === "down") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className={`shrink-0 text-gray-500 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`shrink-0 text-gray-500 transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

const FolderNode = ({
  node,
  currentFolder,
  expandedFolders,
  toggleExpand,
  onFolderClick,
  onDeleteFolder,
  depth = 0,
  baseDepth = 0,
  showDelete = true,
  isTreeActive = true,
}: {
  node: TreeNode;
  currentFolder: string;
  expandedFolders: Set<string>;
  toggleExpand: (path: string, e: React.MouseEvent) => void;
  onFolderClick: (path: string) => void;
  onDeleteFolder: (path: string) => void;
  depth?: number;
  baseDepth?: number;
  showDelete?: boolean;
  isTreeActive?: boolean;
}) => {
  const hasChildren = Object.keys(node.children).length > 0;
  const isExpanded = expandedFolders.has(node.path);
  const cleanCurrent = currentFolder.replace(/\/+$/, "");
  const isActive = isTreeActive && cleanCurrent === node.path;
  const totalDepth = baseDepth + depth;

  const sortedChildren = Object.values(node.children).sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  return (
    <div>
      <div
        className={`group/folder flex items-center justify-between rounded-md text-xs font-medium transition-colors ${
          isActive
            ? "bg-[#d4af37]/10 text-[#d4af37]"
            : "text-gray-400 hover:bg-white/5 hover:text-white"
        }`}
        style={{
          paddingLeft: `${totalDepth * INDENT_PX + 4}px`,
          paddingRight: "6px",
        }}
      >
        <div className="flex min-w-0 flex-1 items-center py-1.5">
          {hasChildren ? (
            <button
              onClick={(e) => toggleExpand(node.path, e)}
              className="mr-1 shrink-0 p-0.5 text-gray-500 transition-colors hover:text-white"
            >
              <Chevron expanded={isExpanded} />
            </button>
          ) : (
            <div className="mr-1 h-[18px] w-[18px] shrink-0" />
          )}

          <button
            onClick={() => onFolderClick(`${node.path}/`)}
            className="flex min-w-0 flex-1 items-center gap-2 truncate text-left"
            title={node.name}
          >
            <span className="shrink-0 text-sm">📁</span>
            <span className="truncate">{node.name}</span>
          </button>
        </div>

        {showDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteFolder(node.path);
            }}
            className="shrink-0 p-1 text-gray-500 opacity-0 transition-all hover:text-red-400 group-hover/folder:opacity-100"
            title="Delete Folder"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        )}
      </div>

      {hasChildren && isExpanded && (
        <div className="space-y-0.5">
          {sortedChildren.map((child) => (
            <FolderNode
              key={child.path}
              node={child}
              currentFolder={currentFolder}
              expandedFolders={expandedFolders}
              toggleExpand={toggleExpand}
              onFolderClick={onFolderClick}
              onDeleteFolder={onDeleteFolder}
              depth={depth + 1}
              baseDepth={baseDepth}
              showDelete={showDelete}
              isTreeActive={isTreeActive}
            />
          ))}
        </div>
      )}
    </div>
  );
};

function TreeSection({
  emoji,
  title,
  subtitle,
  accentClass,
  isExpanded,
  onToggle,
  children,
}: {
  emoji: string;
  title: string;
  subtitle: string;
  accentClass: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-0.5">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition-colors hover:bg-white/[0.04]"
      >
        <Chevron expanded={isExpanded} />
        <span className="shrink-0 text-sm">{emoji}</span>
        <span className="min-w-0 flex-1 truncate">
          <span className={`text-[11px] font-semibold ${accentClass}`}>
            {title}
          </span>
          <span className="text-[10px] text-gray-600"> / </span>
          <span className="text-[10px] text-gray-500">{subtitle}</span>
        </span>
      </button>

      {isExpanded && <TreeChildren className="space-y-0.5">{children}</TreeChildren>}
    </div>
  );
}

function LeafNode({
  emoji,
  label,
  isActive,
  onClick,
  indentLevel = 0,
}: {
  emoji: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
  indentLevel?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-md py-1.5 text-[11px] transition-colors ${
        isActive
          ? "bg-[#d4af37]/10 text-[#d4af37]"
          : "text-gray-500 hover:bg-white/5 hover:text-gray-300"
      }`}
      style={{ paddingLeft: `${indentLevel * INDENT_PX + 4}px` }}
    >
      <span className="shrink-0 text-xs">{emoji}</span>
      <span className="truncate">{label}</span>
    </button>
  );
}

function FolderTree({
  tree,
  currentFolder,
  expandedFolders,
  toggleExpand,
  onFolderClick,
  onDeleteFolder,
  showDelete,
  emptyLabel,
  baseDepth = 1,
  isTreeActive = true,
}: {
  tree: TreeNode;
  currentFolder: string;
  expandedFolders: Set<string>;
  toggleExpand: (path: string, e: React.MouseEvent) => void;
  onFolderClick: (path: string) => void;
  onDeleteFolder: (path: string) => void;
  showDelete: boolean;
  emptyLabel: string;
  baseDepth?: number;
  isTreeActive?: boolean;
}) {
  const sortedRootNodes = Object.values(tree.children).sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  if (sortedRootNodes.length === 0) {
    return (
      <p
        className="py-1.5 text-[10px] italic text-gray-600"
        style={{ paddingLeft: `${baseDepth * INDENT_PX + 4}px` }}
      >
        {emptyLabel}
      </p>
    );
  }

  return (
    <>
      {sortedRootNodes.map((child) => (
        <FolderNode
          key={child.path}
          node={child}
          currentFolder={currentFolder}
          expandedFolders={expandedFolders}
          toggleExpand={toggleExpand}
          onFolderClick={onFolderClick}
          onDeleteFolder={onDeleteFolder}
          depth={0}
          baseDepth={baseDepth}
          showDelete={showDelete}
          isTreeActive={isTreeActive}
        />
      ))}
    </>
  );
}

export default function VaultSidebar({
  currentFolder,
  activeBin,
  allFolders,
  onFolderClick,
  onClientVaultRootClick,
  onBinChange,
  onCreateFolder,
  onDeleteFolder,
}: SidebarProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [clientVaultOpen, setClientVaultOpen] = useState(true);
  const [cloudSectionOpen, setCloudSectionOpen] = useState(true);
  const [vaultSectionOpen, setVaultSectionOpen] = useState(true);

  const vaultTree = React.useMemo(
    () => buildTree(allFolders || []),
    [allFolders],
  );
  const cloudTree = vaultTree;

  useEffect(() => {
    if (!currentFolder) return;
    setExpandedFolders((prev) => {
      const parts = currentFolder.replace(/\/+$/, "").split("/");
      const newExpanded = new Set(prev);
      let path = "";
      let changed = false;

      parts.forEach((part) => {
        path = path ? `${path}/${part}` : part;
        if (!newExpanded.has(path)) {
          newExpanded.add(path);
          changed = true;
        }
      });

      return changed ? newExpanded : prev;
    });
  }, [currentFolder]);

  const toggleExpand = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const isClientVaultRoot = activeBin === "root";

  const selectCloud = () => onBinChange("cloud");
  const selectVault = () => onBinChange("vault");

  const handleCloudRoot = () => {
    selectCloud();
    onFolderClick("");
  };

  const handleVaultRoot = () => {
    selectVault();
    onFolderClick("");
  };

  const handleCloudFolder = (path: string) => {
    selectCloud();
    onFolderClick(path);
  };

  const handleVaultFolder = (path: string) => {
    selectVault();
    onFolderClick(path);
  };

  const toggleCloudSection = () => {
    setCloudSectionOpen((open) => !open);
  };

  const toggleVaultSection = () => {
    setVaultSectionOpen((open) => !open);
  };

  return (
    <aside className="flex h-full w-full shrink-0 flex-col bg-[#0a0a0f]">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/5 px-5">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
          Project Bin
        </h3>
        <button
          onClick={onCreateFolder}
          className="text-[#d4af37] transition-colors hover:text-white"
          title="New Vault Folder"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            <line x1="12" y1="11" x2="12" y2="17" />
            <line x1="9" y1="14" x2="15" y2="14" />
          </svg>
        </button>
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto p-3">
        {/* Parent: CLIENT VAULT */}
        <div className="overflow-hidden rounded-lg border border-white/10 bg-[#08080c] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <div
          className={`flex w-full items-center justify-between gap-2 border-b px-3 py-3 transition-colors ${
            clientVaultOpen ? "border-white/5" : "border-transparent"
          } ${isClientVaultRoot ? "bg-[#d4af37]/10" : ""}`}
        >
          <button
            type="button"
            onClick={() => setClientVaultOpen((open) => !open)}
            className="shrink-0 p-0.5 text-gray-500 transition-colors hover:text-white"
            aria-label="Toggle Client Vault"
          >
            <Chevron expanded={clientVaultOpen} />
          </button>
          <button
            type="button"
            onClick={onClientVaultRootClick}
            className="flex min-w-0 flex-1 items-center gap-2.5 text-left transition-colors hover:opacity-80"
          >
            <span className="text-lg leading-none">🏠</span>
            <span
              className={`text-[11px] font-bold uppercase tracking-[0.2em] ${
                isClientVaultRoot ? "text-[#d4af37]" : "text-gray-300"
              }`}
            >
              Client Vault
            </span>
          </button>
          <button
            type="button"
            onClick={onClientVaultRootClick}
            className={`shrink-0 rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest transition-colors ${
              isClientVaultRoot
                ? "bg-[#d4af37]/20 text-[#d4af37]"
                : "text-gray-600 hover:bg-white/5 hover:text-gray-400"
            }`}
          >
            Root
          </button>
        </div>

          {clientVaultOpen && (
            <div className="space-y-1 p-2">
              <TreeChildren className="space-y-1">
                <TreeSection
                  emoji="☁"
                  title="Cloud Delivery"
                  subtitle="CDN Assets"
                  accentClass="text-[#d4af37]"
                  isExpanded={cloudSectionOpen}
                  onToggle={toggleCloudSection}
                >
                  <LeafNode
                    emoji="☁️"
                    label="All CDN Assets"
                    isActive={activeBin === "cloud" && currentFolder === ""}
                    onClick={handleCloudRoot}
                    indentLevel={0}
                  />
                  <FolderTree
                    tree={cloudTree}
                    currentFolder={currentFolder}
                    expandedFolders={expandedFolders}
                    toggleExpand={toggleExpand}
                    onFolderClick={handleCloudFolder}
                    onDeleteFolder={onDeleteFolder}
                    showDelete={false}
                    emptyLabel="No CDN folders yet"
                    baseDepth={1}
                    isTreeActive={activeBin === "cloud"}
                  />
                </TreeSection>

                <TreeSection
                  emoji="📦"
                  title="Vault"
                  subtitle="Local Storage"
                  accentClass="text-[#d4af37]"
                  isExpanded={vaultSectionOpen}
                  onToggle={toggleVaultSection}
                >
                  <LeafNode
                    emoji="📂"
                    label="All Local Assets"
                    isActive={activeBin === "vault" && currentFolder === ""}
                    onClick={handleVaultRoot}
                    indentLevel={0}
                  />
                  <FolderTree
                    tree={vaultTree}
                    currentFolder={currentFolder}
                    expandedFolders={expandedFolders}
                    toggleExpand={toggleExpand}
                    onFolderClick={handleVaultFolder}
                    onDeleteFolder={onDeleteFolder}
                    showDelete={true}
                    emptyLabel="No vault folders yet"
                    baseDepth={1}
                    isTreeActive={activeBin === "vault"}
                  />
                </TreeSection>
              </TreeChildren>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
