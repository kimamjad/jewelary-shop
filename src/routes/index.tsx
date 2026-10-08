import { createBrowserRouter } from "react-router-dom"
import { PublicLayout } from "@/components/common/public-layout"
import { AdminLayout } from "@/components/common/admin-layout"
import { ProtectedRoute } from "@/routes/protected-route"
import type { UserRole } from "@/types"

import { HomePage } from "@/pages/public/home"
import { ShopPage } from "@/pages/public/shop"
import { CategoryPage } from "@/pages/public/category"
import { ProductDetailPage } from "@/pages/public/product-detail"
import { BlogPage } from "@/pages/public/blog"
import { BlogPostPage } from "@/pages/public/blog-post"
import { AboutPage } from "@/pages/public/about"
import { ContactPage } from "@/pages/public/contact"
import { SearchPage } from "@/pages/public/search"
import { FaqPage } from "@/pages/public/faq"
import { TermsPage } from "@/pages/public/terms"
import { PrivacyPage } from "@/pages/public/privacy"
import { CartPage } from "@/pages/public/cart"
import { WishlistPage } from "@/pages/public/wishlist"
import { CheckoutPage } from "@/pages/public/checkout"
import { NotFoundPage } from "@/pages/public/not-found"

import { LoginPage } from "@/pages/auth/login"
import { SignupPage } from "@/pages/auth/signup"

import { AccountPage } from "@/pages/account/account"
import { OrdersPage } from "@/pages/account/orders"
import { ProfilePage } from "@/pages/account/profile"

import { AdminDashboardPage } from "@/pages/admin/dashboard"
import { AdminProductsPage } from "@/pages/admin/products"
import { AdminProductCreatePage } from "@/pages/admin/product-create"
import { AdminProductEditPage } from "@/pages/admin/product-edit"
import { AdminCategoriesPage } from "@/pages/admin/categories"
import { AdminAttributesPage } from "@/pages/admin/attributes"
import { AdminOrdersPage } from "@/pages/admin/orders"
import { AdminUsersPage } from "@/pages/admin/users"
import { AdminBlogPage } from "@/pages/admin/blog"
import { AdminSettingsPage } from "@/pages/admin/settings"
import { AdminInventoryPage } from "@/pages/admin/inventory"
import { AdminCustomersPage } from "@/pages/admin/customers"
import { AdminDiscountsPage } from "@/pages/admin/discounts"
import { AdminReportsPage } from "@/pages/admin/reports"
import { AdminActivityLogsPage } from "@/pages/admin/activity-logs"
import { AdminRolesPage } from "@/pages/admin/roles"
import { AdminMediaPage } from "@/pages/admin/media"
import { AdminTorobPage } from "@/pages/admin/torob"

const adminRoles: UserRole[] = ["admin", "super_admin", "content_manager", "order_manager", "product_manager"]

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: "/", children: [
        { index: true, element: <HomePage /> },
        { path: "shop", element: <ShopPage /> },
        { path: "category/:slug", element: <CategoryPage /> },
        { path: "product/:slug", element: <ProductDetailPage /> },
        { path: "blog", element: <BlogPage /> },
        { path: "blog/:slug", element: <BlogPostPage /> },
        { path: "about", element: <AboutPage /> },
        { path: "contact", element: <ContactPage /> },
        { path: "search", element: <SearchPage /> },
        { path: "faq", element: <FaqPage /> },
        { path: "terms", element: <TermsPage /> },
        { path: "privacy", element: <PrivacyPage /> },
        { path: "cart", element: <CartPage /> },
        { path: "wishlist", element: <WishlistPage /> },
        { path: "checkout", element: <CheckoutPage /> },
        { path: "*", element: <NotFoundPage /> },
      ]},
      {
        path: "/account",
        element: <ProtectedRoute><AccountPage /></ProtectedRoute>,
        children: [
          { index: true, element: <AccountPage /> },
          { path: "orders", element: <OrdersPage /> },
          { path: "profile", element: <ProfilePage /> },
        ],
      },
      {
        path: "/admin",
        element: (
          <ProtectedRoute requireRoles={adminRoles}>
            <AdminLayout />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <AdminDashboardPage /> },
          { path: "products", element: <AdminProductsPage /> },
          { path: "products/new", element: <AdminProductCreatePage /> },
          { path: "products/:id", element: <AdminProductEditPage /> },
          { path: "categories", element: <AdminCategoriesPage /> },
          { path: "attributes", element: <AdminAttributesPage /> },
          { path: "inventory", element: <AdminInventoryPage /> },
          { path: "orders", element: <AdminOrdersPage /> },
          { path: "customers", element: <AdminCustomersPage /> },
          { path: "discounts", element: <AdminDiscountsPage /> },
          { path: "blog", element: <AdminBlogPage /> },
          { path: "media", element: <AdminMediaPage /> },
          { path: "reports", element: <AdminReportsPage /> },
          { path: "users", element: <AdminUsersPage /> },
          { path: "roles", element: <AdminRolesPage /> },
          { path: "activity-logs", element: <AdminActivityLogsPage /> },
          { path: "settings", element: <AdminSettingsPage /> },
          { path: "torob", element: <AdminTorobPage /> },
        ],
      },
    ],
  },
  { path: "/login", element: <LoginPage /> },
  { path: "/signup", element: <SignupPage /> },
])
