"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"



export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    ...props
}: CalendarProps) {
    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            className={cn("p-4", className)}
            classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4",
                month_caption: "flex justify-center pt-1 relative items-center",
                caption_label: "text-base font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wide",
                nav: "space-x-1 flex items-center",
                button_previous: cn(
                    buttonVariants({ variant: "outline" }),
                    "h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all border-gray-200 dark:border-gray-700 absolute left-1 z-10"
                ),
                button_next: cn(
                    buttonVariants({ variant: "outline" }),
                    "h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all border-gray-200 dark:border-gray-700 absolute right-1 z-10"
                ),
                month_grid: "w-full border-collapse space-y-1",
                weekdays: "flex mb-2",
                weekday:
                    "text-muted-foreground rounded-md w-10 font-normal text-[0.8rem] uppercase tracking-wider text-center flex items-center justify-center",
                week: "flex w-full mt-2 gap-1",
                day: "p-0",
                day_button: cn(
                    buttonVariants({ variant: "ghost" }),
                    "h-10 w-10 p-0 font-normal aria-selected:opacity-100 hover:bg-[#c90000]/10 hover:text-[#c90000] rounded-full transition-all flex items-center justify-center"
                ),
                range_start: "day-range-start",
                range_end: "day-range-end",
                selected:
                    "bg-[#c90000] text-white hover:bg-[#a00000] hover:text-white focus:bg-[#c90000] focus:text-white shadow-md",
                today: "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white font-bold",
                outside:
                    "day-outside text-gray-300 opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30 dark:text-gray-600",
                disabled: "text-gray-200 opacity-30 dark:text-gray-700",
                range_middle:
                    "aria-selected:bg-accent aria-selected:text-accent-foreground",
                hidden: "invisible",
                ...classNames,
            }}
            components={{
                Chevron: ({ ...props }) => {
                    if (props.orientation === 'left') return <ChevronLeft className="h-4 w-4" />;
                    return <ChevronRight className="h-4 w-4" />;
                }
            }}
            {...props}
        />
    )
}
Calendar.displayName = "Calendar"

export { Calendar }
