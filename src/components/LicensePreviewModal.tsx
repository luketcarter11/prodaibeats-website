import { useEffect } from 'react'

interface LicensePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  licenseType: string
  price: string
}

export const LicensePreviewModal = ({ isOpen, onClose, licenseType, price }: LicensePreviewModalProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const currentDate = new Date().toLocaleString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })

  const renderLicenseHeader = (title: string) => (
    <div className="text-center mb-8">
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400">License Name: {licenseType}</p>
      <p className="text-gray-400">Track Title: [Insert Beat Name]</p>
      <p className="text-gray-400">Producer: Prod AI</p>
      <p className="text-gray-400">Effective Date: {currentDate}</p>
    </div>
  )

  const renderLicenseFooter = () => (
    <div className="text-center mt-8 pt-4 border-t border-white/10">
      <p className="text-white font-semibold">Prod AI</p>
      <p className="text-purple-500">www.prodai.com</p>
    </div>
  )

  const getLicenseContent = () => {
    switch(licenseType) {
      case 'Non-Exclusive':
        return renderNonExclusiveLicense()
      case 'Non-Exclusive Plus':
        return renderNonExclusivePlusLicense()
      case 'Exclusive':
        return renderExclusiveLicense()
      case 'Exclusive Plus':
        return renderExclusivePlusLicense()
      case 'Exclusive Pro':
        return renderExclusiveProLicense()
      default:
        return renderDefaultLicense()
    }
  }

  const renderNonExclusiveLicense = () => (
    <div className="space-y-6">
      {renderLicenseHeader('PROD AI NON-EXCLUSIVE LICENSE AGREEMENT')}

      <div>
        <h3 className="text-white font-semibold mb-2">1. Agreement Overview</h3>
        <p>This License Agreement ("Agreement") is made and entered into by and between Prod AI ("Licensor") and the purchaser of this license ("Licensee"), effective as of the date of purchase. This Agreement sets forth the terms under which the Licensee is permitted to use the musical composition identified as "[Insert Beat Name]" (the "Beat").</p>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-2">2. Grant of License</h3>
        <p>Licensor hereby grants Licensee a limited, non-exclusive, non-transferable, and non-sublicensable license to use the Beat for the creation of one (1) new musical composition (the "New Song"), subject to the terms outlined below.</p>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-2">3. Rights Granted</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Use of the Beat on all platforms (Spotify, Apple Music, YouTube, etc.)</li>
          <li>Up to 100,000 combined audio or video streams</li>
          <li>Unlimited non-profit performances</li>
          <li>Unlimited downloads and physical sales</li>
          <li>Synchronization rights for any length or usage including music videos</li>
          <li>Permission to modify the Beat (tempo, pitch, length) to create the New Song</li>
        </ul>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-2">4. Limitations</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>The License is non-exclusive. The same Beat may be licensed to other users.</li>
          <li>Licensee may not copyright or register the Beat itself or the New Song in a way that restricts Licensor's continued use or sale of the Beat.</li>
          <li>Licensee must not resell, lease, sublicense, or otherwise redistribute the Beat or New Song as a standalone item.</li>
          <li>Beat cannot be used for sampling by third parties.</li>
          <li>The Beat or New Song must not be registered with any content ID system, digital aggregator, or copyright enforcement service.</li>
        </ul>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-2">5. Ownership</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Licensor retains all rights, title, and interest in and to the Beat, including the master and composition.</li>
          <li>Licensee owns the lyrics and vocal performance in the New Song but not the instrumental Beat.</li>
          <li>The resulting New Song is considered a derivative work under copyright law.</li>
        </ul>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-2">6. Royalty Split</h3>
        <p>The underlying composition of the New Song will be co-owned as follows:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>50% Licensor (Prod AI)</li>
          <li>50% Licensee (Purchaser)</li>
        </ul>
        <p className="mt-2">Licensee must credit this split when registering the New Song with a Performing Rights Organization (PRO).</p>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-2">7. Delivery</h3>
        <p>The Beat will be delivered as a high-quality MP3 file (tagless) to the email address provided at checkout and will be available in the Licensee's profile/account for future access.</p>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-2">8. Term</h3>
        <p>This license is granted for a lifetime term and does not expire.</p>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-2">9. Termination</h3>
        <p>There is no termination or revocation clause. The license remains in force unless breached. Any violation of the terms outlined in this Agreement may result in immediate termination without refund.</p>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-2">10. Warranties & Indemnification</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Licensor represents that they have full authority to grant this license.</li>
          <li>Licensee agrees to use the Beat at their own risk and assumes responsibility for any third-party claims related to their use of the New Song.</li>
          <li>Licensee agrees to indemnify and hold harmless the Licensor from any liabilities or claims arising from misuse of the Beat.</li>
        </ul>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-2">11. Miscellaneous</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>This Agreement constitutes the entire understanding between the parties.</li>
          <li>The Agreement shall be governed by the laws of the United Kingdom.</li>
          <li>Purchase of this license shall serve as legal acceptance of all terms stated herein.</li>
          <li>No signature is required; electronic acceptance and payment constitute binding agreement.</li>
        </ul>
      </div>

      {renderLicenseFooter()}
    </div>
  )

  const renderNonExclusivePlusLicense = () => (
    <div className="space-y-6">
      {renderLicenseHeader('PROD AI NON-EXCLUSIVE PLUS LICENSE AGREEMENT')}
      
      <div>
        <h3 className="text-white font-semibold mb-2">1. Agreement Overview</h3>
        <p>This License Agreement ("Agreement") is made and entered into by and between Prod AI ("Licensor") and the purchaser of this license ("Licensee"), effective as of the date of purchase. This Agreement sets forth the terms under which the Licensee is permitted to use the musical composition identified as "[Insert Beat Name]" (the "Beat").</p>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-2">2. Grant of License</h3>
        <p>Licensor hereby grants Licensee a limited, non-exclusive, non-transferable, and non-sublicensable license to use the Beat for the creation of one (1) new musical composition (the "New Song"), subject to the terms outlined below.</p>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-2">3. Rights Granted</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Use of the Beat on all platforms (Spotify, Apple Music, YouTube, etc.)</li>
          <li>Unlimited combined audio and video streams</li>
          <li>Unlimited non-profit performances</li>
          <li>Unlimited downloads and physical sales</li>
          <li>Synchronization rights for any length or usage, including music videos</li>
          <li>Permission to modify the Beat (tempo, pitch, length) to create the New Song</li>
        </ul>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-2">4. Limitations</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>The License is non-exclusive. The same Beat may be licensed to other users.</li>
          <li>Licensee may not copyright or register the Beat itself or the New Song in a way that restricts Licensor's continued use or sale of the Beat.</li>
          <li>Licensee must not resell, lease, sublicense, or otherwise redistribute the Beat or New Song as a standalone item.</li>
          <li>Beat cannot be used for sampling by third parties.</li>
          <li>The Beat or New Song must not be registered with any content ID system, digital aggregator, or copyright enforcement service.</li>
        </ul>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-2">5. Ownership</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Licensor retains all rights, title, and interest in and to the Beat, including the master and composition.</li>
          <li>Licensee owns the lyrics and vocal performance in the New Song but not the instrumental Beat.</li>
          <li>The resulting New Song is considered a derivative work under copyright law.</li>
        </ul>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-2">6. Royalty Split</h3>
        <p>The underlying composition of the New Song will be co-owned as follows:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>60% Licensor (Prod AI)</li>
          <li>40% Licensee (Purchaser)</li>
        </ul>
        <p className="mt-2">Licensee must credit this split when registering the New Song with a Performing Rights Organization (PRO).</p>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-2">7. Delivery</h3>
        <p>The Beat will be delivered as a high-quality MP3 file (tagless) to the email address provided at checkout and will be available in the Licensee's profile/account for future access.</p>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-2">8. Term</h3>
        <p>This license is granted for a lifetime term and does not expire.</p>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-2">9. Termination</h3>
        <p>There is no termination or revocation clause. The license remains in force unless breached. Any violation of the terms outlined in this Agreement may result in immediate termination without refund.</p>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-2">10. Warranties & Indemnification</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Licensor represents that they have full authority to grant this license.</li>
          <li>Licensee agrees to use the Beat at their own risk and assumes responsibility for any third-party claims related to their use of the New Song.</li>
          <li>Licensee agrees to indemnify and hold harmless the Licensor from any liabilities or claims arising from misuse of the Beat.</li>
        </ul>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-2">11. Miscellaneous</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>This Agreement constitutes the entire understanding between the parties.</li>
          <li>The Agreement shall be governed by the laws of the United Kingdom.</li>
          <li>Purchase of this license shall serve as legal acceptance of all terms stated herein.</li>
          <li>No signature is required; electronic acceptance and payment constitute binding agreement.</li>
        </ul>
      </div>

      {renderLicenseFooter()}
    </div>
  )

  const renderExclusiveLicense = () => (
    <div className="space-y-6">
      {renderLicenseHeader('PROD AI EXCLUSIVE LICENSE AGREEMENT')}
      
      <div>
        <h3 className="text-white font-semibold mb-2">1. Agreement Overview</h3>
        <p>This License Agreement ("Agreement") is made and entered into by and between Prod AI ("Licensor") and the purchaser of this license ("Licensee"), effective as of the date of purchase. This Agreement outlines the rights granted to Licensee for the use of the musical composition titled "[Insert Beat Name]" (the "Beat").</p>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-2">2. Grant of License</h3>
        <p>Licensor hereby grants Licensee a limited, exclusive, non-transferable, and non-sublicensable license to use the Beat for the creation of one (1) new musical composition (the "New Song"), subject to the terms and conditions stated herein. Upon purchase, this Beat will be removed from future licensing to any additional parties.</p>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-2">3. Rights Granted</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Use of the Beat on all platforms (Spotify, Apple Music, YouTube, etc.)</li>
          <li>Up to 100,000 combined audio and video streams</li>
          <li>Unlimited non-profit performances</li>
          <li>Unlimited downloads and physical sales</li>
          <li>Synchronization rights for any length or usage, including music videos</li>
          <li>Permission to modify the Beat (tempo, pitch, arrangement, etc.)</li>
          <li>Exclusive rights — no future licenses of the same Beat will be issued</li>
        </ul>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-2">4. Limitations</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>The License is exclusive. The same Beat may not be licensed to other users.</li>
          <li>Licensee may not copyright or register the Beat itself or the New Song in a way that restricts Licensor's continued use or sale of the Beat.</li>
          <li>Licensee must not resell, lease, sublicense, or otherwise redistribute the Beat or New Song as a standalone item.</li>
          <li>Beat cannot be used for sampling by third parties.</li>
          <li>The Beat or New Song must not be registered with any content ID system, digital aggregator, or copyright enforcement service.</li>
        </ul>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-2">5. Ownership</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Licensor retains all rights, title, and interest in and to the Beat, including the master and composition.</li>
          <li>Licensee owns the lyrics and vocal performance in the New Song but not the instrumental Beat.</li>
          <li>The resulting New Song is considered a derivative work under copyright law.</li>
        </ul>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-2">6. Royalty Split</h3>
        <p>The underlying composition of the New Song will be co-owned as follows:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>100% Licensor (Prod AI)</li>
        </ul>
        <p className="mt-2">Licensee must credit this split when registering the New Song with a Performing Rights Organization (PRO).</p>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-2">7. Delivery</h3>
        <p>The Beat will be delivered as a high-quality MP3 file (tagless) to the email address provided at checkout and will be available in the Licensee's profile/account for future access.</p>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-2">8. Term</h3>
        <p>This license is granted for a lifetime term and does not expire.</p>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-2">9. Termination</h3>
        <p>There is no termination or revocation clause. The license remains in force unless breached. Any violation of the terms outlined in this Agreement may result in immediate termination without refund.</p>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-2">10. Warranties & Indemnification</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Licensor represents that they have full authority to grant this license.</li>
          <li>Licensee agrees to use the Beat at their own risk and assumes responsibility for any third-party claims related to their use of the New Song.</li>
          <li>Licensee agrees to indemnify and hold harmless the Licensor from any liabilities or claims arising from misuse of the Beat.</li>
        </ul>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-2">11. Miscellaneous</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>This Agreement constitutes the entire understanding between the parties.</li>
          <li>The Agreement shall be governed by the laws of the United Kingdom.</li>
          <li>Purchase of this license shall serve as legal acceptance of all terms stated herein.</li>
          <li>No signature is required; electronic acceptance and payment constitute binding agreement.</li>
        </ul>
      </div>

      {renderLicenseFooter()}
    </div>
  )

  const renderExclusivePlusLicense = () => (
    <div className="space-y-6">
      {renderLicenseHeader('PROD AI EXCLUSIVE PLUS LICENSE AGREEMENT')}
      
      <div>
        <h3 className="text-white font-semibold mb-2">1. Agreement Overview</h3>
        <p>This License Agreement ("Agreement") is made and entered into by and between Prod AI ("Licensor") and the purchaser of this license ("Licensee"), effective as of the date of purchase. This Agreement grants the Licensee exclusive usage rights for the musical composition titled "[Insert Beat Name]" (the "Beat"), subject to the terms and conditions set forth herein.</p>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-2">2. Grant of License</h3>
        <p>Licensor hereby grants Licensee a limited, exclusive, non-transferable, and non-sublicensable license to use the Beat for the creation of one (1) new musical composition (the "New Song"), subject to the terms and conditions set forth herein. Upon purchase, this Beat will be removed from future licensing to any additional parties.</p>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-2">3. Rights Granted</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Use of the Beat on all platforms (Spotify, Apple Music, YouTube, etc.)</li>
          <li>Up to 100,000 combined audio and video streams</li>
          <li>Unlimited non-profit performances</li>
          <li>Unlimited downloads and physical sales</li>
          <li>Synchronization rights for any length or usage, including music videos</li>
          <li>Permission to modify the Beat (tempo, pitch, length) to create the New Song</li>
        </ul>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-2">4. Limitations</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>The License is exclusive. The same Beat may not be licensed to other users.</li>
          <li>Licensee may not copyright or register the Beat itself or the New Song in a way that restricts Licensor's continued use or sale of the Beat.</li>
          <li>Licensee must not resell, lease, sublicense, or otherwise redistribute the Beat or New Song as a standalone item.</li>
          <li>Beat cannot be used for sampling by third parties.</li>
          <li>The Beat or New Song must not be registered with any content ID system, digital aggregator, or copyright enforcement service.</li>
        </ul>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-2">5. Ownership</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Licensor retains all rights, title, and interest in and to the Beat, including the master and composition.</li>
          <li>Licensee owns the lyrics and vocal performance in the New Song but not the instrumental Beat.</li>
          <li>The resulting New Song is considered a derivative work under copyright law.</li>
        </ul>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-2">6. Royalty Split</h3>
        <p>The underlying composition of the New Song will be co-owned as follows:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>100% Licensor (Prod AI)</li>
        </ul>
        <p className="mt-2">Licensee must credit this split when registering the New Song with a Performing Rights Organization (PRO).</p>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-2">7. Delivery</h3>
        <p>The Beat will be delivered as a high-quality MP3 file (tagless) to the email address provided at checkout and will be available in the Licensee's profile/account for future access.</p>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-2">8. Term</h3>
        <p>This license is granted for a lifetime term and does not expire.</p>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-2">9. Termination</h3>
        <p>There is no termination or revocation clause. The license remains in force unless breached. Any violation of the terms outlined in this Agreement may result in immediate termination without refund.</p>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-2">10. Warranties & Indemnification</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Licensor represents that they have full authority to grant this license.</li>
          <li>Licensee agrees to use the Beat at their own risk and assumes responsibility for any third-party claims related to their use of the New Song.</li>
          <li>Licensee agrees to indemnify and hold harmless the Licensor from any liabilities or claims arising from misuse of the Beat.</li>
        </ul>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-2">11. Miscellaneous</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>This Agreement constitutes the entire understanding between the parties.</li>
          <li>The Agreement shall be governed by the laws of the United Kingdom.</li>
          <li>Purchase of this license shall serve as legal acceptance of all terms stated herein.</li>
          <li>No signature is required; electronic acceptance and payment constitute binding agreement.</li>
        </ul>
      </div>

      {renderLicenseFooter()}
    </div>
  )

  const renderExclusiveProLicense = () => (
    <div className="space-y-6">
      {renderLicenseHeader('PROD AI EXCLUSIVE PRO LICENSE AGREEMENT')}
      
      <div>
        <h3 className="text-white font-semibold mb-2">1. Agreement Overview</h3>
        <p>This License Agreement ("Agreement") is made and entered into by and between Prod AI ("Licensor") and the purchaser of this license ("Licensee"), effective as of the date of purchase. This Agreement grants the Licensee exclusive usage rights for the musical composition titled "[Insert Beat Name]" (the "Beat"), subject to the terms and conditions set forth herein.</p>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-2">2. Grant of License</h3>
        <p>Licensor hereby grants Licensee a limited, exclusive, non-transferable, and non-sublicensable license to use the Beat for the creation of one (1) new musical composition (the "New Song"), subject to the terms and conditions set forth herein. Upon purchase, this Beat will be removed from future licensing to any additional parties.</p>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-2">3. Rights Granted</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Use of the Beat on all platforms (Spotify, Apple Music, YouTube, etc.)</li>
          <li>Up to 100,000 combined audio and video streams</li>
          <li>Unlimited non-profit performances</li>
          <li>Unlimited downloads and physical sales</li>
          <li>Synchronization rights for any length or usage, including music videos</li>
          <li>Permission to modify the Beat (tempo, pitch, length) to create the New Song</li>
        </ul>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-2">4. Limitations</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>The License is exclusive. The same Beat may not be licensed to other users.</li>
          <li>Licensee may not copyright or register the Beat itself or the New Song in a way that restricts Licensor's continued use or sale of the Beat.</li>
          <li>Licensee must not resell, lease, sublicense, or otherwise redistribute the Beat or New Song as a standalone item.</li>
          <li>Beat cannot be used for sampling by third parties.</li>
          <li>The Beat or New Song must not be registered with any content ID system, digital aggregator, or copyright enforcement service.</li>
        </ul>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-2">5. Ownership</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Licensor retains all rights, title, and interest in and to the Beat, including the master and composition.</li>
          <li>Licensee owns the lyrics and vocal performance in the New Song but not the instrumental Beat.</li>
          <li>The resulting New Song is considered a derivative work under copyright law.</li>
        </ul>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-2">6. Royalty Split</h3>
        <p>The underlying composition of the New Song will be co-owned as follows:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>100% Licensor (Prod AI)</li>
        </ul>
        <p className="mt-2">Licensee must credit this split when registering the New Song with a Performing Rights Organization (PRO).</p>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-2">7. Delivery</h3>
        <p>The Beat will be delivered as a high-quality MP3 file (tagless) to the email address provided at checkout and will be available in the Licensee's profile/account for future access.</p>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-2">8. Term</h3>
        <p>This license is granted for a lifetime term and does not expire.</p>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-2">9. Termination</h3>
        <p>There is no termination or revocation clause. The license remains in force unless breached. Any violation of the terms outlined in this Agreement may result in immediate termination without refund.</p>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-2">10. Warranties & Indemnification</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Licensor represents that they have full authority to grant this license.</li>
          <li>Licensee agrees to use the Beat at their own risk and assumes responsibility for any third-party claims related to their use of the New Song.</li>
          <li>Licensee agrees to indemnify and hold harmless the Licensor from any liabilities or claims arising from misuse of the Beat.</li>
        </ul>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-2">11. Miscellaneous</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>This Agreement constitutes the entire understanding between the parties.</li>
          <li>The Agreement shall be governed by the laws of the United Kingdom.</li>
          <li>Purchase of this license shall serve as legal acceptance of all terms stated herein.</li>
          <li>No signature is required; electronic acceptance and payment constitute binding agreement.</li>
        </ul>
      </div>

      {renderLicenseFooter()}
    </div>
  )

  const renderDefaultLicense = () => (
    <div className="space-y-6">
      <p>
        This {licenseType} <strong>BeatStars Originals | MP3 License (Contract Preview Only)</strong> License Agreement (the "Agreement"), having been made on
        and effective as of <strong>{currentDate}</strong> (the "Effective Date") by and between <strong>Preview Only</strong> p/k/a <strong>Preview Only</strong> (the "Producer" or "Licensor");
        and <strong>Licensee</strong> residing at <strong>[N/A]</strong> ("You" or "Licensee"), sets forth the terms and conditions of the Licensee's use, and the rights granted in, the
        Producer's instrumental music file entitled <strong>Preview Track Only</strong> (the "Beat") in consideration for Licensee's payment of <strong>${price}</strong> (the "License
        Fee"), on a so-called "<strong>BeatStars Originals | MP3 License (Contract Preview Only)</strong>" basis.
      </p>

      <div>
        <h3 className="text-white font-semibold mb-2">1. License Fee:</h3>
        <p>The Licensee to shall make payment of the License Fee to Licensor on the date of this Agreement. All rights granted to
        Licensee by Producer in the Beat are conditional upon Licensee's timely payment of the License Fee. The License Fee is a one-time
        payment for the rights granted to Licensee and this Agreement is not valid until the License Fee has been paid.</p>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-2">2. Delivery of the Beat:</h3>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Licensor agrees to deliver the Beat as a high-quality MP3, as such terms are understood in the music industry.</li>
          <li>Licensor shall use commercially reasonable efforts to deliver the Beat to Licensee immediately after payment of the License Fee is made. 
          Licensee will receive the Beat via email, to the email address Licensee provided to Licensor.</li>
        </ol>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-2">3. Term:</h3>
        <p>The Term of this Agreement shall be ten (10) years and this license shall expire on the ten (10) year anniversary of the Effective
        Date.</p>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-2">4. Use of the Beat:</h3>
        <p>In consideration for Licensee's payment of the License Fee, the Producer hereby grants Licensee a limited <strong>non-exclusive,
        nontransferable</strong> license and the right to incorporate, include and/or use the Beat in the preparation of one (1) new song or to
        incorporate the Beat into a new piece of instrumental music created by the Licensee. Licensee may create the new song or new
        instrumental music by recording his/her written lyrics over the Beat and/or by incorporating portions/samples of the Beat into pre-
        existing instrumental music written, produced and/or owned by Licensee. The new song or piece of instrumental music created by the
        Licensee which incorporates some or all of the Beat shall be referred to as the "New Song".</p>
      </div>

      {renderLicenseFooter()}
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-xl w-full max-w-3xl max-h-[80vh] overflow-y-auto relative">
        <div className="sticky top-0 bg-zinc-900 p-6 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">License Preview</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 text-gray-300">
          {getLicenseContent()}
        </div>
      </div>
    </div>
  )
} 