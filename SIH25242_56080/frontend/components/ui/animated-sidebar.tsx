"use client"

import { cn } from "@/lib/utils"
import Link, { type LinkProps } from "next/link"
import type React from "react"
import { useState, createContext, useContext } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Menu, X } from "lucide-react"

interface Links {
  label: string
  href: string
  icon: React.JSX.Element | React.ReactNode
}

interface AnimatedSidebarContextProps {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  animate: boolean
}

const AnimatedSidebarContext = createContext<AnimatedSidebarContextProps | undefined>(undefined)

export const useAnimatedSidebar = () => {
  const context = useContext(AnimatedSidebarContext)
  if (!context) {
    throw new Error("useAnimatedSidebar must be used within an AnimatedSidebarProvider")
  }
  return context
}

export const AnimatedSidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode
  open?: boolean
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>
  animate?: boolean
}) => {
  const [openState, setOpenState] = useState(false)

  const open = openProp !== undefined ? openProp : openState
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState

  return (
    <AnimatedSidebarContext.Provider value={{ open, setOpen, animate }}>{children}</AnimatedSidebarContext.Provider>
  )
}

export const AnimatedSidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode
  open?: boolean
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>
  animate?: boolean
}) => {
  return (
    <AnimatedSidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </AnimatedSidebarProvider>
  )
}

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.ComponentProps<"div">)} />
    </>
  )
}

export const DesktopSidebar = ({ className, children, ...props }: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useAnimatedSidebar()
  return (
    <motion.div
      className={cn(
        "fixed left-0 top-0 h-screen px-4 py-4 hidden md:flex md:flex-col bg-[#0D0D0D]/95 backdrop-blur-md border-r border-white/10 w-[280px] flex-shrink-0 z-50",
        className,
      )}
      animate={{
        width: animate ? (open ? "280px" : "70px") : "280px",
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export const MobileSidebar = ({ className, children, ...props }: React.ComponentProps<"div">) => {
  const { open, setOpen } = useAnimatedSidebar()
  return (
    <>
      <div
        className={cn(
          "h-14 px-4 py-4 flex flex-row md:hidden items-center justify-between bg-[#0D0D0D]/95 backdrop-blur-md border-b border-white/10 w-full fixed top-0 left-0 z-50",
        )}
        {...props}
      >
        <div className="flex justify-end z-20 w-full">
          <Menu className="text-white cursor-pointer" onClick={() => setOpen(!open)} />
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: "easeInOut",
              }}
              className={cn(
                "fixed h-full w-full inset-0 bg-[#0D0D0D] p-10 z-[100] flex flex-col justify-between",
                className,
              )}
            >
              <div className="absolute right-10 top-10 z-50 text-white cursor-pointer" onClick={() => setOpen(!open)}>
                <X />
              </div>
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}

export const SidebarLink = ({
  link,
  className,
  active,
  ...props
}: {
  link: Links
  className?: string
  active?: boolean
  props?: LinkProps
}) => {
  const { open, animate } = useAnimatedSidebar()
  return (
    <Link
      href={link.href}
      className={cn(
        "flex items-center justify-start gap-3 group/sidebar py-3 px-3 rounded-lg transition-colors",
        active
          ? "bg-gradient-to-r from-[#00D4FF]/20 to-[#7C3AED]/20 text-white border border-white/10"
          : "text-[#C0C0C0] hover:bg-white/5 hover:text-white",
        className,
      )}
      {...props}
    >
      {link.icon}
      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="text-sm font-open-sans-custom group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0"
      >
        {link.label}
      </motion.span>
    </Link>
  )
}
