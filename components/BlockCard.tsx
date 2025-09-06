import React from "react"
import Link from "next/link"
import Image from "next/image"
import styles from "./BlockCard.module.css"

type Props = {
  title: string
  href: string
  image: string
  description?: string
  height?: string | number  // новый проп
  footer?: boolean
}

export default function BlockCard({ title, href, image, description, height = 180, footer = true }: Props) {
  return (
    <Link href={href} className={styles.card}>
      <div
        className={styles.media}
        style={{ height: typeof height === "number" ? `${height}px` : height }}
      >
        <Image
          src={image}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={false}
        />
      </div>
      {footer ? (
        <div className={styles.content}>
          <h3 className={styles.title}>{title}</h3>
          {description && <p className={styles.desc}>{description}</p>}
        </div>
      ) : null}
    </Link>
  )
}
