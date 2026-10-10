import React, { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api/client";

export interface DropdownItem {
  title: string;
  subtitle?: string;
  value: string;
}

interface SearchableDropdownProps {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: DropdownItem[];
  placeholder?: string;
  endpoint?: string;
}

export function SearchableDropdown({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = "Select or type...",
  endpoint,
}: SearchableDropdownProps) {
  const [query, setQuery] = useState(value || "");
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<DropdownItem[]>(options);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  // Click outside listener to close dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter options or probe endpoint if specified
  useEffect(() => {
    if (!isOpen) return;

    if (!query || query.trim() === "") {
      setItems(options);
      return;
    }

    const q = query.toLowerCase().trim();
    const filtered = options.filter(
      (opt) =>
        opt.title.toLowerCase().includes(q) ||
        (opt.subtitle && opt.subtitle.toLowerCase().includes(q)) ||
        opt.value.toLowerCase().includes(q)
    );

    setItems(filtered);

    // Optional API Probe fallback
    if (endpoint) {
      const timer = setTimeout(async () => {
        try {
          const data: any = await api(`${endpoint}?search=${encodeURIComponent(q)}`, { method: "GET" });
          if (Array.isArray(data) && data.length > 0) {
            const apiItems: DropdownItem[] = data.map((d: any) => ({
              title: d.name || d.title || String(d),
              subtitle: d.description || d.field || "",
              value: d.name || d.title || String(d),
            }));
            setItems(apiItems);
          }
        } catch {
          // Offline/404 fallback: keep local filtered list
        }
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [query, options, endpoint, isOpen]);

  return (
    <div className="ds-field" ref={containerRef} style={{ position: "relative" }}>
      {label && <label htmlFor={id} className="ds-field__label" style={{ fontWeight: 600, fontSize: "0.875rem", marginBottom: "0.4rem", display: "block" }}>{label}</label>}
      <div style={{ position: "relative" }}>
        <input
          id={id}
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            const val = e.target.value;
            setQuery(val);
            onChange(val);
            setIsOpen(true);
          }}
          placeholder={placeholder}
          autoComplete="off"
          style={{
            width: "100%",
            padding: "0.75rem 2.5rem 0.75rem 1rem",
            borderRadius: "10px",
            border: "1px solid var(--border)",
            background: "var(--card)",
            color: "inherit",
            fontFamily: "inherit",
            fontSize: "0.95rem",
            outline: "none",
            boxShadow: isOpen ? "0 0 0 3px rgba(186, 107, 120, 0.2)" : "none",
            transition: "all 0.2s ease",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: "0.85rem",
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
            color: "var(--muted-foreground)",
            display: "flex",
            alignItems: "center",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {isOpen && (
        <ul
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 999,
            marginTop: "0.35rem",
            padding: "0.4rem",
            background: "var(--card, #ffffff)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            boxShadow: "0 12px 28px rgba(0, 0, 0, 0.15)",
            maxHeight: "220px",
            overflowY: "auto",
            listStyle: "none",
          }}
        >
          {items.length > 0 ? (
            items.map((item, index) => (
              <li
                key={index}
                onClick={() => {
                  setQuery(item.value);
                  onChange(item.value);
                  setIsOpen(false);
                }}
                style={{
                  padding: "0.6rem 0.85rem",
                  borderRadius: "8px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.15rem",
                  transition: "background 0.15s ease",
                  background: query === item.value ? "rgba(186, 107, 120, 0.08)" : "transparent",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(186, 107, 120, 0.1)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = query === item.value ? "rgba(186, 107, 120, 0.08)" : "transparent")}
              >
                <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--ink)" }}>{item.title}</div>
                {item.subtitle && (
                  <div style={{ fontSize: "0.78rem", color: "var(--muted-foreground)" }}>{item.subtitle}</div>
                )}
              </li>
            ))
          ) : (
            <li
              style={{
                padding: "0.75rem 0.85rem",
                fontSize: "0.85rem",
                color: "var(--muted-foreground)",
                textAlign: "center",
              }}
            >
              Custom option: &quot;<strong>{query}</strong>&quot; will be saved.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
