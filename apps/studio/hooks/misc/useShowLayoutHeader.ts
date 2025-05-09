import { useParams } from 'common'
import { useIsNewLayoutEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { useRouter } from 'next/router'

export function useShowLayoutHeader() {
  const newLayoutPreview = useIsNewLayoutEnabled()
  const { ref } = useParams()
  const router = useRouter()
  const pathname = router.pathname ?? ''

  const shouldShow =
    pathname.startsWith('/new') ||
    pathname === '/organizations' ||
    pathname === '/sign-in' ||
    newLayoutPreview ||
    Boolean(ref)

  return shouldShow
}
