# Responsive Design Implementation Guide

## Overview
This project uses a **hybrid approach** combining **Tailwind CSS utility classes** with **React hooks** for responsive design.

---

## 1. **Core Responsiveness Logic**

### **A. Custom React Hook: `useIsMobile()`**
**Location:** `src/hooks/use-mobile.tsx`

```typescript
const MOBILE_BREAKPOINT = 768; // px

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
```

**Features:**
- ✅ **Single breakpoint:** `768px` (tablet/mobile split)
- ✅ **Event listener** for window resize
- ✅ **Reactive updates** when screen size changes
- ✅ **Used in:** Sidebar component for mobile/desktop behavior

---

## 2. **Tailwind CSS Breakpoints**

### **Default Tailwind Breakpoints:**
```css
sm:  640px   /* Small devices (landscape phones) */
md:  768px   /* Medium devices (tablets) */
lg:  1024px  /* Large devices (laptops) */
xl:  1280px  /* Extra large (desktops) */
2xl: 1536px  /* 2X Extra large */
```

### **Custom Container Breakpoint:**
```typescript
// tailwind.config.ts
container: {
  screens: {
    "2xl": "1400px", // Custom max width
  },
}
```

---

## 3. **Responsive Design Patterns**

### **A. Mobile-First Approach**
All responsive classes use **mobile-first** - base styles apply to mobile, then override for larger screens:

```tsx
// Mobile (default) → Desktop (override)
<div className="text-base md:text-lg">           // Mobile: 16px, Desktop: 18px
<div className="grid grid-cols-1 md:grid-cols-2"> // Mobile: 1 col, Desktop: 2 cols
```

---

### **B. Common Responsive Patterns Used**

#### **1. Text Sizing**
```tsx
// Headings scale from mobile to desktop
<h1 className="text-xl sm:text-2xl md:text-3xl">
  Dashboard
</h1>

// Body text
<p className="text-sm md:text-base">
  Description text
</p>
```

#### **2. Grid Layouts**
```tsx
// Cards: 1 col mobile → 2 cols tablet → 4 cols desktop
<div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
  {cards.map(...)}
</div>

// Dashboard: 1 col mobile → 2 cols desktop
<div className="grid gap-3 md:gap-4 grid-cols-1 lg:grid-cols-2">
```

#### **3. Flexbox Direction Changes**
```tsx
// Stack on mobile, row on desktop
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
  <h1>Title</h1>
  <Button>Action</Button>
</div>
```

#### **4. Spacing Responsive**
```tsx
// Padding: 16px mobile → 24px desktop
<div className="p-4 sm:p-6">

// Gap: 12px mobile → 16px desktop
<div className="space-y-3 sm:space-y-4 md:space-y-6">
```

#### **5. Icon Sizing**
```tsx
// Icons scale with screen size
<TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
```

#### **6. Button Text Visibility**
```tsx
// Show icon + text on desktop, icon only on mobile
<Button>
  <Plus className="h-4 w-4 sm:mr-2" />
  <span className="hidden sm:inline">Add Teacher</span>
  <span className="sm:hidden">Add</span>
</Button>
```

#### **7. Form Inputs**
```tsx
// Full width mobile, fixed width desktop
<div className="relative flex-1 sm:w-64">
  <Input placeholder="Search..." />
</div>
```

---

## 4. **Component-Specific Responsive Logic**

### **A. Sidebar Component**
**Location:** `src/components/ui/sidebar.tsx`

**Features:**
- ✅ **Mobile detection** using `useIsMobile()`
- ✅ **Different behavior:**
  - **Desktop:** Expandable/collapsible sidebar
  - **Mobile:** Sheet/Modal overlay
- ✅ **Different widths:**
  - Desktop: `16rem`
  - Mobile: `18rem`
  - Icon-only: `3rem`

```tsx
const isMobile = useIsMobile();
const toggleSidebar = () => {
  return isMobile ? setOpenMobile(...) : setOpen(...);
};
```

---

### **B. Charts (Recharts)**
**Location:** Multiple dashboard pages

```tsx
import { ResponsiveContainer } from 'recharts';

<ResponsiveContainer width="100%" height="100%">
  <BarChart data={data}>
    {/* Chart components */}
  </BarChart>
</ResponsiveContainer>
```

**Features:**
- ✅ **Auto-resize** based on container
- ✅ **Maintains aspect ratio**
- ✅ **Works with grid layouts**

---

## 5. **Breakpoint Strategy**

### **Mobile-First Flow:**
```
Mobile (< 640px)        → Default styles
Small (≥ 640px)         → sm: classes
Medium (≥ 768px)        → md: classes
Large (≥ 1024px)        → lg: classes
Extra Large (≥ 1280px)  → xl: classes
2X Large (≥ 1536px)     → 2xl: classes
```

### **Common Breakpoint Usage:**
- `sm:` - Show more content on tablets
- `md:` - Desktop layouts start
- `lg:` - Large desktop layouts

---

## 6. **Best Practices in This Project**

### ✅ **Do's:**
1. **Mobile-first** - Start with mobile, enhance for larger screens
2. **Use Tailwind utilities** - Prefer utility classes over media queries
3. **Consistent spacing** - Use `gap-3 md:gap-4` pattern
4. **Hide/show content** - Use `hidden sm:inline` for conditional visibility
5. **Responsive grids** - `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`

### ❌ **Don'ts:**
1. Don't use inline styles for responsive
2. Don't mix breakpoints inconsistently
3. Don't forget to test on actual devices

---

## 7. **Examples from Codebase**

### **Example 1: Dashboard Header**
```tsx
<div className="space-y-3 sm:space-y-4 md:space-y-6">
  <div>
    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Dashboard</h1>
    <p className="text-sm md:text-base text-muted-foreground">
      Overview of training sessions
    </p>
  </div>
</div>
```

### **Example 2: Card Grid**
```tsx
<div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
  {statsCards.map(card => (
    <Card key={card.id}>{card.content}</Card>
  ))}
</div>
```

### **Example 3: Action Bar**
```tsx
<div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
  <SearchInput className="flex-1 sm:w-64" />
  <Button className="flex-1 sm:flex-initial">
    <Plus className="h-4 w-4 sm:mr-2" />
    <span className="hidden sm:inline">Add Teacher</span>
  </Button>
</div>
```

---

## 8. **Testing Responsiveness**

### **Chrome DevTools Breakpoints:**
- Mobile: `320px - 767px`
- Tablet: `768px - 1023px`
- Desktop: `1024px+`

### **Key Test Points:**
1. ✅ `320px` - Small mobile
2. ✅ `768px` - Tablet (mobile hook breakpoint)
3. ✅ `1024px` - Desktop
4. ✅ `1280px` - Large desktop

---

## 9. **Performance Considerations**

1. **CSS-only solution** - Tailwind classes are compiled at build time
2. **No runtime calculations** - Except for `useIsMobile()` hook
3. **Event listeners** - Properly cleaned up in `useEffect`
4. **Minimal re-renders** - Only when window size actually changes

---

## Summary

Your project uses:
- **Tailwind CSS** for 90% of responsive design (utility classes)
- **React Hook** (`useIsMobile`) for component logic (sidebar behavior)
- **Mobile-first** approach throughout
- **Consistent breakpoints** across all components
- **Recharts ResponsiveContainer** for charts

This is a **modern, efficient** responsive design implementation! 🎯

