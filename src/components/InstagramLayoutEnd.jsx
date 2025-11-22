// This is the end part of InstagramLayout that includes the UploadModal
// Add this to the end of the InstagramLayout component, just before the closing div and export

        {/* Upload Modal */}
        <UploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          uploadType={uploadType}
          onSubmit={(uploadData) => handleUploadSubmit(uploadData, currentUser, setPosts, setUploadProgress)}
        />

        {/* Music Selector Modal */}
        <MusicSelector
          isOpen={showMusicSelector}
          onClose={() => setShowMusicSelector(false)}
          onSelect={(music) => {
            setSelectedMusic(music);
            setShowMusicSelector(false);
          }}
        />
      </div>
    </div>
  )
}

export default InstagramLayout