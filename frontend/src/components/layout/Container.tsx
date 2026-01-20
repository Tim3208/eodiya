type ContainerProps = {
  children: React.ReactNode;
  className?: string;
};

export function Container({ children, className }: ContainerProps) {
  const classes = ["mx-auto w-full max-w-5xl px-6", className]
    .filter(Boolean)
    .join(" ");

  return <div className={classes}>{children}</div>;
}
