"use client";

import { defineRegistry } from "@json-render/react";
import { Weather } from "@/components/chatbot/weather";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { chatCatalog } from "./catalog";

const gapClass = {
  sm: "gap-2",
  md: "gap-3",
  lg: "gap-4",
} as const;

export const { registry } = defineRegistry(chatCatalog, {
  components: {
    Stack: ({ props, children }) => (
      <div
        className={cn(
          "flex w-full",
          props.direction === "horizontal"
            ? "flex-row flex-wrap items-stretch"
            : "flex-col",
          gapClass[props.gap ?? "md"],
        )}
      >
        {children}
      </div>
    ),
    Card: ({ props, children }) => (
      <Card className="w-full max-w-xl gap-4 py-4 shadow-none">
        <CardHeader className="px-4 pb-0">
          <CardTitle className="text-base">{props.title}</CardTitle>
          {props.description ? (
            <CardDescription>{props.description}</CardDescription>
          ) : null}
        </CardHeader>
        {children ? (
          <CardContent className="px-4 pt-0">{children}</CardContent>
        ) : null}
      </Card>
    ),
    Heading: ({ props }) => {
      const level = props.level ?? "h3";
      switch (level) {
        case "h2":
          return (
            <h2 className="text-lg font-semibold tracking-tight">
              {props.text}
            </h2>
          );
        case "h3":
          return (
            <h3 className="text-base font-semibold tracking-tight">
              {props.text}
            </h3>
          );
        case "h4":
          return (
            <h4 className="text-sm font-semibold tracking-tight">
              {props.text}
            </h4>
          );
        default: {
          const _exhaustive: never = level;
          return _exhaustive;
        }
      }
    },
    Text: ({ props }) => (
      <p
        className={cn(
          "text-sm leading-relaxed",
          props.muted ? "text-muted-foreground" : "text-foreground",
        )}
      >
        {props.content}
      </p>
    ),
    Metric: ({ props }) => (
      <div className="min-w-28 flex-1 rounded-md border bg-muted/30 px-3 py-2">
        <p className="text-xs font-medium text-muted-foreground">
          {props.label}
        </p>
        <p className="mt-1 text-xl font-semibold tabular-nums tracking-tight">
          {props.value}
        </p>
        {props.detail ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{props.detail}</p>
        ) : null}
      </div>
    ),
    Badge: ({ props }) => (
      <Badge variant={props.variant ?? "secondary"}>{props.label}</Badge>
    ),
    Alert: ({ props }) => (
      <Alert variant={props.tone === "destructive" ? "destructive" : "default"}>
        {props.title ? <AlertTitle>{props.title}</AlertTitle> : null}
        <AlertDescription>{props.message}</AlertDescription>
      </Alert>
    ),
    Weather: ({ props }) => (
      <Weather
        location={props.location}
        temperature={props.temperature}
        weather={props.weather}
      />
    ),
  },
});
