import styles from './LoadingSpinner.module.css'

export default function LoadingSpinner({ size = 32 }: { size?: number }) {
  return (
    <div className={styles.container}>
      <div
        className={styles.spinner}
        style={{ width: size, height: size }}
      />
    </div>
  )
}
