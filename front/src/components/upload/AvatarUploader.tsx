'use client';

import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import Uppy from '@uppy/core';
import XHRUpload from '@uppy/xhr-upload';
import { toast } from 'sonner';

interface AvatarUploaderProps {
  onUploadSuccess: (avatarUrl: string) => void;
  onUploadError?: (error: string) => void;
}

const AvatarUploader = forwardRef<HTMLInputElement, AvatarUploaderProps>(
  ({ onUploadSuccess, onUploadError }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const uppy = React.useMemo(() => {
      return new Uppy({
        id: 'avatar-uploader',
        autoProceed: true,
        allowMultipleUploadBatches: false,
        restrictions: {
          maxFileSize: 5 * 1024 * 1024, // 5MB
          maxNumberOfFiles: 1,
          allowedFileTypes: ['image/*']
        }
      })
      .use(XHRUpload, {
        endpoint: '/api/files/upload/avatar',
        formData: true,
        fieldName: 'file',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
      })
      .on('upload-success', (file, response) => {
        const { fileUrl } = response.body;
        onUploadSuccess(fileUrl);
        toast.success('头像上传成功');
        uppy.removeFile(file.id);
      })
      .on('upload-error', (file, error, response) => {
        const errorMessage = error.message || '上传失败';
        onUploadError?.(errorMessage);
        toast.error(`头像上传失败：${errorMessage}`);
        uppy.removeFile(file.id);
      })
      .on('cancel-all', () => {
        uppy.clear();
        if (inputRef.current) {
          inputRef.current.value = '';
        }
      });
    }, [onUploadSuccess, onUploadError]);

    useImperativeHandle(ref, () => inputRef.current!);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files && files[0]) {
        try {
          uppy.addFile({
            name: files[0].name,
            type: files[0].type,
            data: files[0]
          });
        } catch (err) {
          console.error(err);
        }
      }
    };

    return (
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        style={{ display: 'none' }}
      />
    );
  }
);

AvatarUploader.displayName = 'AvatarUploader';

export default AvatarUploader;