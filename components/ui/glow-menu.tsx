"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface MenuItem {
  icon: LucideIcon | React.FC<any>
  label: string
  href: string
  gradient: string
  iconColor: string
}

interface MenuBarProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onItemClick'> {
  items: MenuItem[]
  activeItem?: string
  onItemClick?: (label: string) => void
}

const itemVariants = {
  initial: { rotateX: 0, opacity: 1 },
  hover: { rotateX: -90, opacity: 0 },
}

const backVariants = {
  initial: { rotateX: 90, opacity: 0 },
  hover: { rotateX: 0, opacity: 1 },
}

const glowVariants = {
  initial: { opacity: 0, scale: 0.8 },
  hover: {
    opacity: 1,
    scale: 2,
    transition: {
      opacity: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
      scale: { duration: 0.5, type: "spring", stiffness: 300, damping: 25 },
    },
  },
}

const navGlowVariants = {
  initial: { opacity: 0 },
  hover: {
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1],
    },
  },
}

const sharedTransition = {
  type: "spring",
  stiffness: 100,
  damping: 20,
  duration: 0.5,
}

export const MenuBar = React.forwardRef<HTMLDivElement, MenuBarProps>(
  ({ className, items, activeItem, onItemClick, ...props }, ref) => {
    const { theme } = useTheme()
    const isDarkTheme = theme === "dark" || document.documentElement.classList.contains("dark")

    return (
      <motion.nav
        ref={ref}
        className={cn(
          "p-2 rounded-2xl bg-gradient-to-b from-slate-50/90 to-slate-100/90 dark:from-slate-900/90 dark:to-slate-950/90 backdrop-blur-lg border border-slate-200/50 dark:border-slate-800/50 shadow-lg relative overflow-hidden",
          className,
        )}
        initial="initial"
        whileHover="hover"
        {...props}
      >
        <motion.div
          className={`absolute -inset-2 bg-gradient-radial from-transparent ${
            isDarkTheme
              ? "via-blue-400/30 via-30% via-purple-400/30 via-60% via-red-400/30 via-90%"
              : "via-blue-400/20 via-30% via-purple-400/20 via-60% via-red-400/20 via-90%"
          } to-transparent rounded-3xl z-0 pointer-events-none`}
          variants={navGlowVariants}
        />
        <ul className="flex flex-wrap items-center justify-center gap-1 md:gap-2 relative z-10">
          {items.map((item) => {
            const Icon = item.icon
            const isActive = item.label === activeItem

            return (
              <motion.li key={item.label} className="relative">
                <button
                  onClick={() => onItemClick?.(item.label)}
                  className="block w-full"
                >
                  <motion.div
                    className="block rounded-xl overflow-visible group relative"
                    style={{ perspective: "600px" }}
                    whileHover="hover"
                    initial="initial"
                  >
                    <motion.div
                      className="absolute inset-0 z-0 pointer-events-none"
                      variants={glowVariants}
                      animate={isActive ? "hover" : "initial"}
                      style={{
                        background: item.gradient,
                        opacity: isActive ? 1 : 0,
                        borderRadius: "16px",
                      }}
                    />
                    <motion.div
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 relative z-10 bg-transparent transition-colors rounded-xl",
                        isActive
                          ? "text-slate-900 dark:text-white"
                          : "text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white",
                      )}
                      variants={itemVariants}
                      transition={sharedTransition}
                      style={{
                        transformStyle: "preserve-3d",
                        transformOrigin: "center bottom",
                      }}
                    >
                      <span
                        className={cn(
                          "transition-colors duration-300",
                          isActive ? item.iconColor : "text-inherit",
                        )}
                      >
                        <Icon className="h-4 w-4 md:h-5 md:w-5" />
                      </span>
                      <span className="text-xs md:text-sm font-medium hidden sm:inline-block">{item.label}</span>
                    </motion.div>
                    <motion.div
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 absolute inset-0 z-10 bg-transparent transition-colors rounded-xl",
                        isActive
                          ? "text-slate-900 dark:text-white"
                          : "text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white",
                      )}
                      variants={backVariants}
                      transition={sharedTransition}
                      style={{
                        transformStyle: "preserve-3d",
                        transformOrigin: "center top",
                        rotateX: 90,
                      }}
                    >
                      <span
                        className={cn(
                          "transition-colors duration-300",
                          isActive ? item.iconColor : "text-inherit",
                        )}
                      >
                        <Icon className="h-4 w-4 md:h-5 md:w-5" />
                      </span>
                      <span className="text-xs md:text-sm font-medium hidden sm:inline-block">{item.label}</span>
                    </motion.div>
                  </motion.div>
                </button>
              </motion.li>
            )
          })}
        </ul>
      </motion.nav>
    )
  },
)

MenuBar.displayName = "MenuBar"
