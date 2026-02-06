package com.elmayorista.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.util.UUID;

/**
 * Service to handle file uploads to an S3-compatible object storage like
 * Cloudflare R2.
 */
@Service
public class FileStorageService {

    private final S3Client s3Client;
    private final String bucketName;
    private final String publicUrl;

    public FileStorageService(S3Client s3Client,
            @Value("${spring.cloud.aws.s3.bucket}") String bucketName,
            @Value("${app.r2.public-url}") String publicUrl) {
        this.s3Client = s3Client;
        this.bucketName = bucketName;
        this.publicUrl = publicUrl;
    }

    /**
     * Uploads a file to a specific path (prefix) in the configured R2 bucket.
     *
     * @param file   The MultipartFile to upload.
     * @param prefix The path or "folder" where the file will be stored (e.g.,
     *               "receipts", "pdfs").
     * @return The public URL of the uploaded file.
     * @throws IOException if there is an error reading the file.
     */
    public String uploadFile(MultipartFile file, String prefix) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Cannot upload an empty file.");
        }
        if (prefix == null || prefix.isBlank()) {
            throw new IllegalArgumentException("A path prefix is required for uploading files.");
        }

        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        // Generate a unique key for the file to avoid name collisions, including the
        // prefix
        String key = prefix + "/" + UUID.randomUUID().toString() + extension;

        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .contentType(file.getContentType())
                .contentLength(file.getSize())
                .build();

        // Upload the file to R2
        s3Client.putObject(request, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

        // Construct the public URL for the file using the public-facing domain.
        // The public URL does not require the bucket name in the path.
        return publicUrl + "/" + key;
    }

    /**
     * Uploads a byte array to a specific path (prefix) in the configured R2 bucket.
     *
     * @param data        The byte array to upload.
     * @param filename    The filename to use (will be prefixed with UUID to avoid
     *                    collisions).
     * @param prefix      The path or "folder" where the file will be stored (e.g.,
     *                    "reports", "pdfs").
     * @param contentType The MIME type of the file.
     * @return The public URL of the uploaded file.
     */
    public String uploadBytes(byte[] data, String filename, String prefix, String contentType) {
        if (data == null || data.length == 0) {
            throw new IllegalArgumentException("Cannot upload empty data.");
        }
        if (prefix == null || prefix.isBlank()) {
            throw new IllegalArgumentException("A path prefix is required for uploading files.");
        }

        String extension = "";
        if (filename != null && filename.contains(".")) {
            extension = filename.substring(filename.lastIndexOf("."));
        }

        // Generate a unique key for the file to avoid name collisions, including the
        // prefix
        String key = prefix + "/" + UUID.randomUUID().toString() + extension;

        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .contentType(contentType)
                .contentLength((long) data.length)
                .build();

        // Upload the data to R2
        s3Client.putObject(request, RequestBody.fromBytes(data));

        // Construct the public URL for the file using the public-facing domain.
        return publicUrl + "/" + key;
    }
}