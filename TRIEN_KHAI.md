# HƯỚNG DẪN TRIỂN KHAI VÀ VẬN HÀNH HỆ THỐNG AI CLASSROOM

Hệ thống **AI CLASSROOM – TRỢ LÝ LỚP HỌC THÔNG MINH** (Trường Tiểu học Hoài Nhơn) đã được tối ưu hóa toàn diện để chạy mượt mà trên cả **Máy tính cục bộ (Localhost)** và **Triển khai trực tuyến lên đám mây Vercel (Miễn phí 100%)**.

---

## CÁCH 1: KHỞI CHẠY NGAY TRÊN MÁY TÍNH (1-CLICK)

Tôi đã tạo sẵn file thực thi nhanh `chay_ung_dung.bat` trong thư mục gốc của dự án:
1. Mở thư mục dự án `d:\lop hoc\quan ly lop hoc`.
2. Nhấp đúp chuột (Double click) vào file **`chay_ung_dung.bat`**.
3. Cửa sổ dòng lệnh sẽ tự động khởi động máy chủ và trình duyệt web sẽ tự động mở trang web tại địa chỉ:
   👉 **`http://localhost:3000`**

*(Hoặc mở Command Prompt / PowerShell tại thư mục này và gõ lệnh: `npm run dev`)*

---

## CÁCH 2: TRIỂN KHAI MIỄN PHÍ LÊN VERCEL (ĐỂ CHIA SẺ TRỰC TUYẾN)

Toàn bộ các file cấu hình bắt buộc đã được thiết lập sẵn sàng:
- **`vercel.json`**: Đã cấu hình lệnh rewrite SPA để ứng dụng không bao giờ bị lỗi 404 khi tải lại trang hoặc bấm F5.
- **`index.html`**: Đã liên kết chuẩn `<script type="module" src="/src/main.tsx"></script>`.
- **`package.json`**: Lệnh build chuẩn `vite build` và xuất thư mục `dist`.

### Các bước đẩy lên Vercel:

### Bước 1: Đẩy mã nguồn lên GitHub
1. Mở phần mềm **GitHub Desktop** (hoặc dùng Git trên máy tính).
2. Tạo một Repository mới hoặc Commit toàn bộ thư mục `quan ly lop hoc` lên tài khoản GitHub của bạn.
3. Nhấn **Push** để đưa toàn bộ mã nguồn lên GitHub.

### Bước 2: Liên kết với Vercel
1. Truy cập trang web: [https://vercel.com](https://vercel.com) và đăng nhập bằng tài khoản GitHub của bạn.
2. Nhấn nút **"Add New..."** ➔ Chọn **"Project"**.
3. Chọn Repository GitHub dự án bạn vừa tải lên ➔ Nhấn **"Import"**.
4. Tại màn hình cấu hình:
   - **Framework Preset**: Chọn **Vite**.
   - **Root Directory**: Giữ nguyên `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Nhấn nút **"Deploy"**.

### Bước 3: Hoàn thành và nhận đường link sử dụng
- Sau khoảng 1 phút, Vercel sẽ cấp cho bạn một đường link trực tuyến dạng:
  👉 **`https://ten-du-an-cua-ban.vercel.app`**
- Bạn có thể gửi link này cho Ban Giám Hiệu, Hội đồng chấm thi, Phụ huynh và Học sinh sử dụng trực tiếp trên máy tính, máy tính bảng hoặc điện thoại thông minh.

---

## 🔑 HƯỚNG DẪN THIẾT LẬP GEMINI API KEY ĐỂ SỬ DỤNG AI TRỰC TUYẾN

Hệ thống được thiết kế theo chuẩn **AI tự trị & Fallback sư phạm thông minh**:
1. **Lấy API Key miễn phí từ Google:**
   - Truy cập: [https://aistudio.google.com/api-keys](https://aistudio.google.com/api-keys)
   - Đăng nhập tài khoản Gmail và nhấn **"Create API key"** ➔ Sao chép mã khóa.
2. **Nhập vào hệ thống:**
   - Khi vào ứng dụng, trên thanh Menu đầu trang (Header) luôn có nút **Settings (Thiết lập API Key)** kèm dòng chữ màu đỏ *"Lấy API key để sử dụng app"*.
   - Nhấn vào nút đó ➔ Dán mã khóa vừa lấy vào ô nhập ➔ Chọn Model (khuyến nghị `gemini-3-flash-preview` hoặc `gemini-3-pro-preview`) ➔ Nhấn **"Lưu thiết lập"**.
   - Key được mã hóa và lưu trữ an toàn trong `localStorage` của trình duyệt, người dùng chỉ cần nhập một lần duy nhất.
3. **Cơ chế Fallback (Không lo gián đoạn):**
   - Nếu chưa nhập API Key hoặc khi mạng bị ngắt, hệ thống tự động kích hoạt **Bộ dữ liệu mẫu sư phạm chuẩn Bộ GD&ĐT** để giáo viên vẫn trình diễn, soạn giáo án và lập báo cáo bình thường.

---

## 👥 THÔNG TIN ĐĂNG NHẬP MẶC ĐỊNH
- **Giáo viên chủ nhiệm:**
  - Tên đăng nhập: `thhn_3c1` (hoặc `thhn_#malop#` theo tên lớp)
  - Mật khẩu: `Thhn_12@` (có thể đổi mật khẩu bất kỳ lúc nào)
- **Học sinh:**
  - Tên đăng nhập & Mật khẩu: Tự động đồng bộ từ Link Google Sheet đã liên kết.
