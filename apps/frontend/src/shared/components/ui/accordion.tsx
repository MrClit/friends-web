import * as React from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { MdExpandMore } from 'react-icons/md';
import { cn } from '@/shared/utils';

// ============================================================================
// PRIMITIVE COMPONENTS - Direct re-exports from Radix Accordion
// ============================================================================

/**
 * Accordion: a list of independently collapsible panels.
 *
 * Use `type="multiple"` for panels that open on their own, `type="single"` when opening one should
 * close the rest. Radix handles the aria wiring, the roving arrow-key navigation between headers and
 * the height measurement the animation needs.
 */
const Accordion = AccordionPrimitive.Root;

// ============================================================================
// COMPLEX COMPONENTS - Item, Trigger and Content
// ============================================================================

/**
 * AccordionItem: one collapsible panel. Needs a `value` unique within its Accordion.
 */
function AccordionItem({ ref, className, ...props }: React.ComponentPropsWithRef<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      ref={ref}
      className={cn('rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900', className)}
      {...props}
    />
  );
}
AccordionItem.displayName = AccordionPrimitive.Item.displayName;

/**
 * AccordionTrigger: the header that opens and closes its panel.
 *
 * The whole header is the button, not just the chevron: on a phone a 24px glyph is a mean target. The
 * chevron rotates on open and carries `motion-reduce`, like the rest of the primitives here.
 */
function AccordionTrigger({
  ref,
  className,
  children,
  ...props
}: React.ComponentPropsWithRef<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        ref={ref}
        className={cn(
          // Layout
          'flex flex-1 items-center justify-between gap-3 text-left',
          'px-4 py-3',
          // Interaction
          'cursor-pointer transition-colors',
          'hover:bg-slate-50 dark:hover:bg-slate-800/60',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-inset rounded-xl',
          className,
        )}
        {...props}
      >
        {children}
        <MdExpandMore
          aria-hidden="true"
          className="shrink-0 text-xl text-slate-400 transition-transform duration-200 data-[state=open]:rotate-180 motion-reduce:transition-none dark:text-slate-500"
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

/**
 * AccordionContent: the panel itself.
 *
 * Radix keeps it mounted while animating and measures it into --radix-accordion-content-height, which
 * is what the accordion-down/up keyframes in tailwind.config.js consume. Padding goes on the inner
 * div, never on the animated element: animating a box whose padding is part of its height makes the
 * open and close jump at the ends.
 */
function AccordionContent({
  ref,
  className,
  children,
  ...props
}: React.ComponentPropsWithRef<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      ref={ref}
      className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down motion-reduce:animate-none"
      {...props}
    >
      <div className={cn('px-4 pb-3', className)}>{children}</div>
    </AccordionPrimitive.Content>
  );
}
AccordionContent.displayName = AccordionPrimitive.Content.displayName;

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
